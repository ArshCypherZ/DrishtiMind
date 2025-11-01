"""
Gemini Bot Implementation.

This module implements a chatbot using Google's Gemini Multimodal Live model.
It includes:
- Real-time audio interaction
- Speech-to-speech using the Gemini Multimodal Live API
- Transcription using Gemini's generate_content API
- RTVI client/server events
"""

import asyncio
from datetime import date
import sys
import os

import aiohttp
from requests import get
from loguru import logger
from runner import configure

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.frames.frames import Frame, EndFrame, TranscriptionFrame
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.processors.frameworks.rtvi import (
    RTVIBotTranscriptionProcessor,
    RTVIMetricsProcessor,
    RTVISpeakingProcessor,
    RTVIUserTranscriptionProcessor,
)
from pipecat.services.gemini_multimodal_live.gemini import GeminiMultimodalLiveLLMService
from pipecat.transports.services.daily import DailyParams, DailyTransport
from dotenv import load_dotenv

logger.remove(0)
logger.add(sys.stderr, level="DEBUG")
load_dotenv()

class UserTranscriptionFrameFilter(FrameProcessor):
    """Filter out UserTranscription frames."""

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, TranscriptionFrame) and frame.user_id == "user":
            return

        await self.push_frame(frame, direction)


async def main():
    """Main bot execution function.

    Sets up and runs the bot pipeline including:
    - Daily video transport with specific audio parameters
    - Gemini Live multimodal model integration
    - Voice activity detection
    - Animation processing
    - RTVI event handling
    """
    async with aiohttp.ClientSession() as session:
        (room_url, token, custom_prompt) = await configure(session)
        
        # Default system instruction for practice conversations
        SYSTEM_INSTRUCTION = f"""You are a practice conversation partner. Stay in character with assigned traits. Respond naturally with real emotions. Keep responses brief: 1-2 short sentences maximum. Be conversational, not explanatory. Today is {date.today().strftime("%A, %B %d, %Y")}."""

        # Set up Daily transport with specific audio/video parameters for Gemini
        transport = DailyTransport(
            room_url,
            token,
            "Chatbot",
            DailyParams(
                audio_in_sample_rate=16000,
                audio_out_sample_rate=24000,
                audio_out_enabled=True,
                camera_out_enabled=True,
                camera_out_width=1024,
                camera_out_height=576,
                vad_enabled=True,
                vad_audio_passthrough=True,
                vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.5)),
            ),
        )

        # Minimal tools for faster responses
        tools = [
            {
                "function_declarations": [
                    {
                        "name": "log_milestone",
                        "description": "Log key conversation moments",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "type": {"type": "string"},
                                "quality": {"type": "string"},
                            },
                        }
                    },
                    {
                        "name": "end_feedback",
                        "description": "Generate feedback at end",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "score": {"type": "number"},
                                "notes": {"type": "string"},
                            },
                        }
                    },
                ]
            }
        ]

        # Use custom prompt if provided, otherwise use default practice prompt
        final_system_instruction = custom_prompt if custom_prompt else SYSTEM_INSTRUCTION
        
        # Initialize the Gemini Multimodal Live model with proper configuration
        try:
            llm = GeminiMultimodalLiveLLMService(
                api_key=os.getenv('GEMINI_API_KEY'),
                model="models/gemini-2.0-flash",
                voice_id="Kore",
                transcribe_user_audio=True,
                transcribe_model_audio=True,
                system_instruction=final_system_instruction,
                tools=tools,
            )
            
            # Patch websocket connection with timeout and optimized config
            async def patched_connect():
                if llm._websocket:
                    return
                import websockets
                from pipecat.services.gemini_multimodal_live import events
                uri = f"wss://{llm.base_url}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={llm.api_key}"
                logger.info(f"Connecting to {uri[:80]}...")
                llm._websocket = await websockets.connect(uri=uri, open_timeout=30, ping_timeout=30)
                llm._receive_task = llm.get_event_loop().create_task(llm._receive_task_handler())
                
                config = events.Config.model_validate({
                    "setup": {
                        "model": llm._model_name,
                        "generation_config": {
                            "temperature": 0.8,
                            "max_output_tokens": 100,
                            "response_modalities": ["AUDIO"],
                            "speech_config": {"voice_config": {"prebuilt_voice_config": {"voice_name": llm._voice_id}}},
                        },
                    },
                })
                if llm._system_instruction:
                    config.setup.system_instruction = events.SystemInstruction(
                        parts=[events.ContentPart(text=llm._system_instruction)]
                    )
                if llm._tools:
                    config.setup.tools = llm._tools
                await llm.send_client_event(config)
                
            llm._connect = patched_connect
            logger.info("Gemini service initialized with extended timeout")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini service: {e}")
            raise

        def log_milestone(type: str, quality: str):
            logger.info(f"Milestone: {type} - {quality}")
            return {"logged": True}
        
        def end_feedback(score: float, notes: str):
            logger.info(f"Feedback: {score}/10 - {notes}")
            return {"saved": True}
        
        llm.register_function("log_milestone", log_milestone)
        llm.register_function("end_feedback", end_feedback)

        # Initial message for practice conversation
        messages = [
            {"role": "system", "content": final_system_instruction},
            {"role": "user", "content": "Start naturally as this person."},
        ]

        # Set up conversation context and management
        context = OpenAILLMContext(messages, tools=tools)
        context_aggregator = llm.create_context_aggregator(context)

        # RTVI events for Pipecat client UI
        rtvi_speaking = RTVISpeakingProcessor()
        rtvi_user_transcription = RTVIUserTranscriptionProcessor()
        rtvi_bot_transcription = RTVIBotTranscriptionProcessor()
        rtvi_metrics = RTVIMetricsProcessor()

        pipeline = Pipeline(
            [
                transport.input(),
                context_aggregator.user(),
                llm,
                rtvi_speaking,
                rtvi_user_transcription,
                UserTranscriptionFrameFilter(),
                rtvi_bot_transcription,
                rtvi_metrics,
                transport.output(),
                context_aggregator.assistant(),
            ]
        )

        task = PipelineTask(
            pipeline,
            PipelineParams(
                allow_interruptions=True,
                enable_metrics=True,
                enable_usage_metrics=True,
            ),
        )

        @transport.event_handler("on_first_participant_joined")
        async def on_first_participant_joined(transport, participant):
            await transport.capture_participant_transcription(participant["id"])
            await task.queue_frames([context_aggregator.user().get_context_frame()])

        @transport.event_handler("on_participant_left")
        async def on_participant_left(transport, participant, reason):
            print(f"Participant left: {participant}")
            await task.queue_frame(EndFrame())

        runner = PipelineRunner()

        await runner.run(task)


if __name__ == "__main__":
    asyncio.run(main())
