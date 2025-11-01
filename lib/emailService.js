// Email Service for Drishti
// This service handles sending detailed email summaries alongside notifications

class EmailService {
  constructor() {
    this.isConfigured = false;
    this.initializeEmailProvider();
  }

  async initializeEmailProvider() {
    try {
      if (process.env.SENDGRID_API_KEY) {
        const sgMail = await import('@sendgrid/mail');
        this.sendgrid = sgMail.default;
        this.sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
        this.provider = 'sendgrid';
        this.isConfigured = true;
      } else {
        console.warn('Email service not configured. Please set SENDGRID_API_KEY environment variable.');
        this.isConfigured = false;
      }
    } catch (error) {
      console.error('Failed to initialize email provider:', error);
      this.isConfigured = false;
    }
  }

  // Get user's email preferences
  async getUserEmailPreferences(userId) {
    try {
      const { prisma } = await import('./prisma.js');
      let user;
      
      try {
        user = await prisma.user.findUnique({
          where: { id: userId },
          select: { 
            email: true,
            email_preferences: true
          }
        });
      } catch (schemaError) {
        console.log('email_preferences field not found, using default preferences', schemaError);
        user = await prisma.user.findUnique({
          where: { id: userId },
          select: { 
            email: true
          }
        });
        user.email_preferences = {
          weekly_summary: true,
          monthly_summary: true,
          milestones: true,
          daily_reminders: false
        };
      }
      
      return user || { email: null, email_preferences: { weekly_summary: true, monthly_summary: true, milestones: true, daily_reminders: false } };
    } catch (error) {
      console.error('Error fetching user email preferences:', error);
      return { email: null, email_preferences: { weekly_summary: true, monthly_summary: true, milestones: true, daily_reminders: false } };
    }
  }

  // Check if user has opted in for specific email type
  shouldSendEmail(preferences, emailType) {
    if (!preferences) return false;
    
    const emailPrefs = preferences.email_preferences || {};
    return emailPrefs[emailType] !== false && emailPrefs.enabled !== false;
  }

  // Send weekly summary email
  async sendWeeklySummaryEmail(userId, weeklySummary) {
    try {
      console.log(`Starting weekly summary email for user ${userId}`);
      console.log(`Email service configured: ${this.isConfigured}`);
      console.log(`Email provider: ${this.provider}`);

      if (!this.isConfigured) {
        console.log('Email service not configured, skipping weekly summary email');
        console.log('Missing SENDGRID_API_KEY environment variable');
        return { success: false, reason: 'Email service not configured' };
      }

      const user = await this.getUserEmailPreferences(userId);
      console.log(`User email: ${user.email}`);
      console.log(`Email preferences:`, JSON.stringify(user.email_preferences, null, 2));

      if (!user.email) {
        console.log(`User ${userId} has no email address`);
        return { success: false, reason: 'No email address found' };
      }

      if (!this.shouldSendEmail(user, 'weekly_summary')) {
        console.log(`User ${userId} not opted in for weekly summary emails`);
        return { success: false, reason: 'User not opted in' };
      }

      console.log(`User ${userId} opted in for weekly summary emails, preparing email...`);
      
      const emailContent = this.generateWeeklySummaryEmailContent(weeklySummary);
      
      const result = await this.sendEmail({
        to: user.email,
        subject: `Your Weekly Wellness Summary - ${this.formatDateRange(weeklySummary.week_start, weeklySummary.week_end)}`,
        ...emailContent
      });

      console.log(`Email send result:`, result);
      return result;
    } catch (error) {
      console.error('Error sending weekly summary email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send monthly summary email
  async sendMonthlySummaryEmail(userId, monthlySummary) {
    try {
      if (!this.isConfigured) {
        console.log('Email service not configured, skipping monthly summary email');
        return { success: false, reason: 'Email service not configured' };
      }

      const user = await this.getUserEmailPreferences(userId);
      if (!user.email || !this.shouldSendEmail(user, 'monthly_summary')) {
        console.log(`User ${userId} not opted in for monthly summary emails or no email found`);
        return { success: false, reason: 'User not opted in' };
      }

      const emailContent = this.generateMonthlySummaryEmailContent(monthlySummary);
      
      const result = await this.sendEmail({
        to: user.email,
        subject: `Your Monthly Wellness Report - ${this.formatMonthYear(monthlySummary.month, monthlySummary.year)}`,
        ...emailContent
      });

      return result;
    } catch (error) {
      console.error('Error sending monthly summary email:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate weekly summary email content
  generateWeeklySummaryEmailContent(weeklySummary) {
    const insights = weeklySummary.growth_insights || [];
    const achievements = weeklySummary.achievement_highlights || [];
    const challenges = weeklySummary.challenges_faced || [];
    const recommendations = weeklySummary.recommendations || [];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Weekly Wellness Summary</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: #f8fafc;
            margin: 0;
            padding: 0;
          }
          
          .container {
            max-width: 680px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="1" fill="white" opacity="0.1"/><circle cx="10" cy="50" r="1" fill="white" opacity="0.1"/><circle cx="90" cy="90" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          
          .header-content {
            position: relative;
            z-index: 1;
          }
          
          .header h1 {
            font-size: 2.2em;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .header .date-range {
            font-size: 1.1em;
            opacity: 0.95;
            font-weight: 300;
          }
          
          .content {
            padding: 0;
          }
          
          .section {
            padding: 30px;
            border-bottom: 1px solid #f1f5f9;
          }
          
          .section:last-child {
            border-bottom: none;
          }
          
          .section-title {
            font-size: 1.3em;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .section-title .emoji {
            font-size: 1.2em;
          }
          
          .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          
          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          }
          
          .stat-number {
            font-size: 2.2em;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 4px;
          }
          
          .stat-label {
            font-size: 0.85em;
            color: #64748b;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .mood-display {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 12px;
            margin: 20px 0;
          }
          
          .mood-emoji {
            font-size: 4em;
            margin-bottom: 12px;
            display: block;
          }
          
          .mood-text {
            font-size: 1.1em;
            color: #92400e;
            font-weight: 500;
          }
          
          .list-item {
            padding: 16px;
            margin-bottom: 12px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            transition: all 0.2s ease;
          }
          
          .list-item:hover {
            background: #f1f5f9;
            transform: translateX(4px);
          }
          
          .list-item:last-child {
            margin-bottom: 0;
          }
          
          .list-item .emoji {
            font-size: 1.1em;
            flex-shrink: 0;
            margin-top: 2px;
          }
          
          .list-item-content {
            flex: 1;
            font-size: 0.95em;
            line-height: 1.5;
            color: #475569;
          }
          
          .highlight-box {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 1px solid #bfdbfe;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
          }
          
          .highlight-box h4 {
            color: #1e40af;
            margin-bottom: 8px;
            font-weight: 600;
          }
          
          .highlight-box p {
            color: #1e3a8a;
            line-height: 1.6;
          }
          
          .footer {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          
          .footer p {
            margin-bottom: 10px;
          }
          
          .footer .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            margin-top: 10px;
            transition: transform 0.2s ease;
          }
          
          .footer .cta-button:hover {
            transform: translateY(-2px);
          }
          
          .footer .small-text {
            font-size: 0.8em;
            opacity: 0.7;
            margin-top: 15px;
          }
          
          @media only screen and (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 12px;
            }
            
            .header {
              padding: 30px 20px;
            }
            
            .header h1 {
              font-size: 1.8em;
            }
            
            .section {
              padding: 20px;
            }
            
            .stat-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            
            .stat-card {
              padding: 16px;
            }
            
            .stat-number {
              font-size: 1.8em;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-content">
              <h1>🌟 Your Weekly Wellness Summary</h1>
              <div class="date-range">${this.formatDateRange(weeklySummary.week_start, weeklySummary.week_end)}</div>
            </div>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">
                <span class="emoji">📊</span>
                Your Week at a Glance
              </div>
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-number">${weeklySummary.total_mood_entries || 0}</div>
                  <div class="stat-label">Mood Check-ins</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${weeklySummary.total_journals || 0}</div>
                  <div class="stat-label">Journal Entries</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${weeklySummary.total_perspective_sessions || 0}</div>
                  <div class="stat-label">Perspective Sessions</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${weeklySummary.avg_mood_rate ? Math.round(weeklySummary.avg_mood_rate) : 'N/A'}</div>
                  <div class="stat-label">Avg Mood Score</div>
                </div>
              </div>
            </div>

            ${weeklySummary.avg_mood_emoji ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">😊</span>
                Your Dominant Mood
              </div>
              <div class="mood-display">
                <span class="mood-emoji">${weeklySummary.avg_mood_emoji}</span>
                <div class="mood-text">This mood represents your overall emotional state this week.</div>
              </div>
            </div>
            ` : ''}

            ${weeklySummary.dominant_theme ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">🎯</span>
                Weekly Theme
              </div>
              <div class="highlight-box">
                <h4>Your Week's Focus</h4>
                <p>"${weeklySummary.dominant_theme}"</p>
              </div>
            </div>
            ` : ''}

            ${insights.length > 0 ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">💡</span>
                Growth Insights
              </div>
              ${insights.map(insight => `
                <div class="list-item">
                  <span class="emoji">✨</span>
                  <div class="list-item-content">${insight}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${achievements.length > 0 ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">🏆</span>
                Achievement Highlights
              </div>
              ${achievements.map(achievement => `
                <div class="list-item">
                  <span class="emoji">🎯</span>
                  <div class="list-item-content">${achievement}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${challenges.length > 0 ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">💪</span>
                Challenges & Growth Areas
              </div>
              ${challenges.map(challenge => `
                <div class="list-item">
                  <span class="emoji">🔥</span>
                  <div class="list-item-content">${challenge}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${recommendations.length > 0 ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">🌱</span>
                Recommendations for Next Week
              </div>
              ${recommendations.map(rec => `
                <div class="list-item">
                  <span class="emoji">✨</span>
                  <div class="list-item-content">${rec}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${weeklySummary.detailed_summary ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">📖</span>
                Detailed Summary
              </div>
              <div class="highlight-box">
                <p>${weeklySummary.detailed_summary}</p>
              </div>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p style="font-size: 1.1em; font-weight: 600;">Keep up the great work! 🌟</p>
            <p style="margin: 15px 0;">Your commitment to self-awareness is inspiring.</p>
            <a href="#" class="cta-button">View Your Full Dashboard</a>
            <div class="small-text">
              Want to adjust your email preferences? Update your settings in your profile.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Your Weekly Wellness Summary
${this.formatDateRange(weeklySummary.week_start, weeklySummary.week_end)}

📊 Your Week at a Glance:
• Mood Check-ins: ${weeklySummary.total_mood_entries || 0}
• Journal Entries: ${weeklySummary.total_journals || 0}
• Perspective Sessions: ${weeklySummary.total_perspective_sessions || 0}
• Avg Mood Score: ${weeklySummary.avg_mood_rate ? Math.round(weeklySummary.avg_mood_rate) : 'N/A'}

${weeklySummary.avg_mood_emoji ? `😊 Your Dominant Mood: ${weeklySummary.avg_mood_emoji}` : ''}

${weeklySummary.dominant_theme ? `🎯 Weekly Theme: "${weeklySummary.dominant_theme}"` : ''}

${insights.length > 0 ? `
💡 Growth Insights:
${insights.map(insight => `• ${insight}`).join('\n')}
` : ''}

${achievements.length > 0 ? `
🏆 Achievement Highlights:
${achievements.map(achievement => `• ${achievement}`).join('\n')}
` : ''}

${challenges.length > 0 ? `
💪 Challenges & Growth Areas:
${challenges.map(challenge => `• ${challenge}`).join('\n')}
` : ''}

${recommendations.length > 0 ? `
🌱 Recommendations for Next Week:
${recommendations.map(rec => `• ${rec}`).join('\n')}
` : ''}

${weeklySummary.detailed_summary ? `
📖 Detailed Summary:
${weeklySummary.detailed_summary}
` : ''}

Keep up the great work! 🌟
Your commitment to self-awareness is inspiring.
`;

    return {
      html: htmlContent,
      text: textContent
    };
  }

  // Generate monthly summary email content
  generateMonthlySummaryEmailContent(monthlySummary) {
    const insights = monthlySummary.growth_insights || [];
    const achievements = monthlySummary.achievement_highlights || [];
    const challenges = monthlySummary.challenges_faced || [];
    const recommendations = monthlySummary.recommendations || [];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Monthly Wellness Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: #f8fafc;
            margin: 0;
            padding: 0;
          }
          
          .container {
            max-width: 700px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          }
          
          .header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 45px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="1" fill="white" opacity="0.1"/><circle cx="10" cy="50" r="1" fill="white" opacity="0.1"/><circle cx="90" cy="90" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          
          .header-content {
            position: relative;
            z-index: 1;
          }
          
          .header h1 {
            font-size: 2.4em;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .header .date-range {
            font-size: 1.2em;
            opacity: 0.95;
            font-weight: 300;
            margin-bottom: 8px;
          }
          
          .header .subtitle {
            font-size: 1.05em;
            opacity: 0.9;
            font-weight: 300;
          }
          
          .content {
            padding: 0;
          }
          
          .section {
            padding: 35px;
            border-bottom: 1px solid #f1f5f9;
          }
          
          .section:last-child {
            border-bottom: none;
          }
          
          .section-title {
            font-size: 1.4em;
            font-weight: 600;
            color: #f5576c;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .section-title .emoji {
            font-size: 1.3em;
          }
          
          .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 16px;
            margin-bottom: 25px;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #fdf4ff 0%, #fce7f3 100%);
            border: 1px solid #fbcfe8;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          
          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          }
          
          .stat-number {
            font-size: 2.1em;
            font-weight: 700;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 4px;
          }
          
          .stat-label {
            font-size: 0.8em;
            color: #be185d;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .mood-display {
            text-align: center;
            padding: 35px;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 12px;
            margin: 25px 0;
          }
          
          .mood-emoji {
            font-size: 4.5em;
            margin-bottom: 15px;
            display: block;
          }
          
          .mood-text {
            font-size: 1.15em;
            color: #92400e;
            font-weight: 500;
          }
          
          .list-item {
            padding: 18px;
            margin-bottom: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #f5576c;
            display: flex;
            align-items: flex-start;
            gap: 14px;
            transition: all 0.2s ease;
          }
          
          .list-item:hover {
            background: #f1f5f9;
            transform: translateX(4px);
          }
          
          .list-item:last-child {
            margin-bottom: 0;
          }
          
          .list-item .emoji {
            font-size: 1.2em;
            flex-shrink: 0;
            margin-top: 2px;
          }
          
          .list-item-content {
            flex: 1;
            font-size: 0.95em;
            line-height: 1.5;
            color: #475569;
          }
          
          .highlight-box {
            background: linear-gradient(135deg, #fef7ff 0%, #fde8ff 100%);
            border: 1px solid #f9a8d4;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
          }
          
          .highlight-box h4 {
            color: #be185d;
            margin-bottom: 10px;
            font-weight: 600;
            font-size: 1.1em;
          }
          
          .highlight-box p {
            color: #9f1239;
            line-height: 1.6;
            font-size: 1.05em;
          }
          
          .month-review {
            background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
            border: 1px solid #fb923c;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
          }
          
          .month-review h4 {
            color: #c2410c;
            margin-bottom: 10px;
            font-weight: 600;
            font-size: 1.1em;
          }
          
          .month-review p {
            color: #9a3412;
            line-height: 1.6;
            font-size: 1.05em;
            font-style: italic;
          }
          
          .footer {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            padding: 35px;
            text-align: center;
          }
          
          .footer p {
            margin-bottom: 12px;
          }
          
          .footer .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 14px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            margin-top: 12px;
            transition: transform 0.2s ease;
          }
          
          .footer .cta-button:hover {
            transform: translateY(-2px);
          }
          
          .footer .small-text {
            font-size: 0.8em;
            opacity: 0.7;
            margin-top: 20px;
          }
          
          @media only screen and (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 12px;
            }
            
            .header {
              padding: 35px 20px;
            }
            
            .header h1 {
              font-size: 1.9em;
            }
            
            .section {
              padding: 25px;
            }
            
            .stat-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            
            .stat-card {
              padding: 16px;
            }
            
            .stat-number {
              font-size: 1.7em;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-content">
              <h1>📊 Your Monthly Wellness Report</h1>
              <div class="date-range">${this.formatMonthYear(monthlySummary.month, monthlySummary.year)}</div>
              <div class="subtitle">A comprehensive look at your wellness journey</div>
            </div>
          </div>
          
          <div class="content">
            <div class="month-review">
              <h4>🌟 Month in Review</h4>
              <p>${monthlySummary.short_summary || 'Another month of growth and self-discovery!'}</p>
            </div>

            <div class="section">
              <div class="section-title">
                <span class="emoji">📈</span>
                Your Monthly Stats
              </div>
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-number">${monthlySummary.total_mood_entries || 0}</div>
                  <div class="stat-label">Mood Check-ins</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${monthlySummary.total_journals || 0}</div>
                  <div class="stat-label">Journal Entries</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${monthlySummary.total_perspective_sessions || 0}</div>
                  <div class="stat-label">Perspective Sessions</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${monthlySummary.total_weekly_summaries || 0}</div>
                  <div class="stat-label">Weekly Summaries</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${monthlySummary.avg_mood_rate ? Math.round(monthlySummary.avg_mood_rate) : 'N/A'}</div>
                  <div class="stat-label">Avg Mood Score</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${monthlySummary.overall_wellness_score ? Math.round(monthlySummary.overall_wellness_score) : 'N/A'}</div>
                  <div class="stat-label">Wellness Score</div>
                </div>
              </div>
            </div>

            ${monthlySummary.avg_mood_emoji ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">😊</span>
                Your Emotional Theme
              </div>
              <div class="mood-display">
                <span class="mood-emoji">${monthlySummary.avg_mood_emoji}</span>
                <div class="mood-text">This emoji represents your dominant emotional state this month.</div>
              </div>
            </div>
            ` : ''}

            ${monthlySummary.dominant_theme ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">🎯</span>
                Dominant Theme
              </div>
              <div class="highlight-box">
                <h4>Your Month's Focus</h4>
                <p>"${monthlySummary.dominant_theme}"</p>
              </div>
            </div>
            ` : ''}

            ${insights.length > 0 ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">💡</span>
                Key Growth Insights
              </div>
              ${insights.map(insight => `
                <div class="list-item">
                  <span class="emoji">🌱</span>
                  <div class="list-item-content">${insight}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${achievements.length > 0 ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">🏆</span>
                Major Achievements
              </div>
              ${achievements.map(achievement => `
                <div class="list-item">
                  <span class="emoji">🎉</span>
                  <div class="list-item-content">${achievement}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${challenges.length > 0 ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">💪</span>
                Challenges Overcome
              </div>
              ${challenges.map(challenge => `
                <div class="list-item">
                  <span class="emoji">🔥</span>
                  <div class="list-item-content">${challenge}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${recommendations.length > 0 ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">✨</span>
                Recommendations for Next Month
              </div>
              ${recommendations.map(rec => `
                <div class="list-item">
                  <span class="emoji">🌈</span>
                  <div class="list-item-content">${rec}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${monthlySummary.detailed_summary ? `
            <div class="section">
              <div class="section-title">
                <span class="emoji">📖</span>
                In-Depth Analysis
              </div>
              <div class="highlight-box">
                <p>${monthlySummary.detailed_summary}</p>
              </div>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p style="font-size: 1.2em; font-weight: 600; margin-bottom: 15px;">🎉 Congratulations on another month of wellness! 🎉</p>
            <p style="margin: 15px 0; font-size: 1.05em;">Your dedication to personal growth is truly inspiring.</p>
            <a href="#" class="cta-button">View Your Complete Journey</a>
            <div class="small-text">
              Want to adjust your email preferences? Update your settings in your profile.<br>
              This monthly report helps you track your progress and celebrate your growth journey.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Your Monthly Wellness Report
${this.formatMonthYear(monthlySummary.month, monthlySummary.year)}

🌟 Month in Review: ${monthlySummary.short_summary || 'Another month of growth and self-discovery!'}

📈 Your Monthly Stats:
• Mood Check-ins: ${monthlySummary.total_mood_entries || 0}
• Journal Entries: ${monthlySummary.total_journals || 0}
• Perspective Sessions: ${monthlySummary.total_perspective_sessions || 0}
• Weekly Summaries: ${monthlySummary.total_weekly_summaries || 0}
• Avg Mood Score: ${monthlySummary.avg_mood_rate ? Math.round(monthlySummary.avg_mood_rate) : 'N/A'}
• Wellness Score: ${monthlySummary.overall_wellness_score ? Math.round(monthlySummary.overall_wellness_score) : 'N/A'}

${monthlySummary.avg_mood_emoji ? `😊 Your Emotional Theme: ${monthlySummary.avg_mood_emoji}` : ''}

${monthlySummary.dominant_theme ? `🎯 Dominant Theme: "${monthlySummary.dominant_theme}"` : ''}

${insights.length > 0 ? `
💡 Key Growth Insights:
${insights.map(insight => `• ${insight}`).join('\n')}
` : ''}

${achievements.length > 0 ? `
🏆 Major Achievements:
${achievements.map(achievement => `• ${achievement}`).join('\n')}
` : ''}

${challenges.length > 0 ? `
💪 Challenges Overcome:
${challenges.map(challenge => `• ${challenge}`).join('\n')}
` : ''}

${recommendations.length > 0 ? `
✨ Recommendations for Next Month:
${recommendations.map(rec => `• ${rec}`).join('\n')}
` : ''}

${monthlySummary.detailed_summary ? `
📖 In-Depth Analysis:
${monthlySummary.detailed_summary}
` : ''}

🎉 Congratulations on another month of wellness! 🎉
Your dedication to personal growth is truly inspiring.
`;

    return {
      html: htmlContent,
      text: textContent
    };
  }

  // Send email
  async sendEmail({ to, subject, html, text }) {
    try {
      if (this.provider === 'sendgrid') {
        const msg = {
          to: to,
          from: process.env.SENDGRID_FROM_EMAIL || 'drishti0mind@gmail.com',
          subject: subject,
          text: text,
          html: html,
        };
        
        const result = await this.sendgrid.send(msg);
        return { success: true, provider: 'sendgrid', result };
      }
      
      return { success: false, error: 'No email provider configured' };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility functions
  formatDateRange(startDate, endDate) {
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  }

  formatMonthYear(month, year) {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}

const emailService = new EmailService();
export default emailService;
