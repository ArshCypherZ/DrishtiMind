import json
import base64
import asyncio
import argparse
import os
import subprocess
import aiohttp
import websockets
import traceback

from contextlib import asynccontextmanager
from typing import Any, Dict
from pydantic import BaseModel

from fastapi import FastAPI, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.websockets import WebSocketDisconnect

from pipecat.transports.services.helpers.daily_rest import DailyRESTHelper, DailyRoomParams


from dotenv import load_dotenv

load_dotenv()



"""
RTVI Bot Server Implementation.

This FastAPI server manages RTVI bot instances and provides endpoints for both
direct browser access and RTVI client connections. It handles:
- Creating Daily rooms
- Managing bot processes
- Providing connection credentials
- Monitoring bot status
"""


# Constants
MAX_BOTS_PER_ROOM = 1

# Global state
bot_procs = {}
daily_helpers = {}


def cleanup():
    """Terminate all bot processes during server shutdown."""
    for proc, _ in bot_procs.values():
        proc.terminate()
        proc.wait()


def get_bot_file() -> str:
    """Return the bot file to execute."""
    return "bot-gemini"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown."""
    aiohttp_session = aiohttp.ClientSession()
    daily_helpers["rest"] = DailyRESTHelper(
        daily_api_key=os.getenv("DAILY_API_KEY"),
        daily_api_url="https://api.daily.co/v1",
        aiohttp_session=aiohttp_session,
    )
    yield
    await aiohttp_session.close()
    cleanup()


# Initialize FastAPI app
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def create_room_and_token() -> tuple[str, str]:
    """Create a Daily room and generate an access token."""
    room = await daily_helpers["rest"].create_room(DailyRoomParams())
    if not room.url:
        raise HTTPException(status_code=500, detail="Failed to create room")

    token = await daily_helpers["rest"].get_token(room.url)
    if not token:
        raise HTTPException(status_code=500, detail=f"Failed to get token for room: {room.url}")

    return room.url, token


@app.get("/")
async def start_agent(request: Request):
    """Create a room, start a bot, and redirect to the room URL."""
    print("Creating room...")
    room_url, token = await create_room_and_token()
    print(f"Room URL: {room_url}")

    # Check if max bots limit is reached
    if sum(1 for _, url in bot_procs.values() if url == room_url) >= MAX_BOTS_PER_ROOM:
        raise HTTPException(status_code=500, detail=f"Max bot limit reached for room: {room_url}")

    try:
        bot_file = get_bot_file()
        proc = subprocess.Popen(
            [f"python3 -m {bot_file} -u {room_url} -t {token}"],
            shell=True,
            bufsize=1,
            cwd=os.path.dirname(os.path.abspath(__file__)),
        )
        bot_procs[proc.pid] = (proc, room_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start subprocess: {e}")

    return RedirectResponse(room_url)


@app.post("/connect")
async def rtvi_connect(request: Request) -> Dict[Any, Any]:
    """Create a room and return connection credentials."""
    body = await request.json()
    session_id = body.get("sessionId")
    system_prompt = body.get("systemPrompt", "")
    
    print("Creating room for RTVI connection...")
    room_url, token = await create_room_and_token()
    print(f"Room URL: {room_url}")

    # Start bot process with custom system prompt via environment variable
    try:
        bot_file = get_bot_file()
        env = os.environ.copy()
        env["CUSTOM_SYSTEM_PROMPT"] = system_prompt
        proc = subprocess.Popen(
            ["python3", "-m", bot_file, "-u", room_url, "-t", token],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            cwd=os.path.dirname(os.path.abspath(__file__)),
        )
        bot_procs[proc.pid] = (proc, room_url)
        print(f"Bot process started with PID: {proc.pid}")
    except Exception as e:
        print(f"Failed to start bot: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start subprocess: {e}")

    return {"room_url": room_url, "token": token, "session_id": session_id}


@app.get("/status/{pid}")
def get_status(pid: int):
    """Get the status of a specific bot process."""
    proc = bot_procs.get(pid)
    if not proc:
        raise HTTPException(status_code=404, detail=f"Bot with process ID: {pid} not found")

    status = "running" if proc[0].poll() is None else "finished"
    return JSONResponse({"bot_id": pid, "status": status})






if __name__ == "__main__":
    import uvicorn

    default_host = os.getenv("HOST", "0.0.0.0")
    default_port = int(os.getenv("PORT", "7860"))

    parser = argparse.ArgumentParser(description="FastAPI Server")
    parser.add_argument("--host", type=str, default=default_host, help="Host address")
    parser.add_argument("--port", type=int, default=default_port, help="Port number")
    parser.add_argument("--reload", action="store_true", help="Reload code on changes")

    config = parser.parse_args()

    uvicorn.run(
        "server:app",
        host=config.host,
        port=config.port,
        reload=config.reload,
    )
