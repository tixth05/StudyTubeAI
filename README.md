# StudyTube AI 🎓

A full-stack SaaS application that transforms study notes into AI-powered explainer videos with interactive quizzes.

## Features

✨ **AI-Powered Content Generation**
- Automatic summary generation from study material
- AI-generated narration scripts
- Structured scene breakdowns
- Interactive MCQ quizzes with explanations

🎬 **Video Generation**
- Hybrid TTS narration (ElevenLabs + Web Speech API fallback)
- Beautiful gradient slides
- FFmpeg video assembly
- Cloud storage integration

💳 **Credit System**
- 30 free videos per month
- Automatic monthly reset
- Flexible pricing tiers
- Usage tracking

🔐 **Authentication**
- Email/Phone signup with OTP verification
- Secure password authentication
- Password reset functionality
- Session management with Supabase

## Tech Stack

- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: Google Gemini API
- **TTS**: ElevenLabs API (primary) + Web Speech API (fallback)
- **Video**: FFmpeg, Canvas

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher)
2. **FFmpeg** installed on your system
   - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - Mac: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`

3. **API Keys**:
   - Supabase account (free tier available)
   - Google Gemini API key
   - ElevenLabs API key (optional - falls back to Web Speech API)

## Setup Instructions

### 1. Clone and Install

```bash
cd studytube-ai
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `src/lib/supabase/schema.sql`
3. Create a storage bucket named `videos` with public access
4. Copy your project URL and API keys

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Fill in your API keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key_optional
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
studytube-ai/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Landing page
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # User dashboard
│   ├── chat/                # Video generation interface
│   ├── pricing/             # Pricing page
│   └── api/                 # API routes
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── landing/        # Landing page components
│   │   ├── quiz/           # Interactive quiz
│   │   └── ...
│   ├── lib/                # Utility libraries
│   │   ├── supabase/       # Database client
│   │   ├── gemini/         # AI processing
│   │   ├── tts/            # Text-to-speech
│   │   ├── video/          # Video generation
│   │   ├── credits/        # Credit management
│   │   └── auth/           # Auth helpers
│   └── types/              # TypeScript types
└── public/                 # Static assets
```

## Hybrid TTS System 🎙️

The application uses a **hybrid text-to-speech strategy** to ensure narration always works:

### Primary: ElevenLabs API
- High-quality AI voice generation
- Uses free-tier credits first
- Automatic fallback on error/rate limit

### Fallback: Web Speech API
- Browser-based TTS (no API key needed)
- Always available as backup
- Ensures zero-cost operation

### How it Works
1. System tries ElevenLabs API first
2. If unavailable (no key, rate limit, error) → automatically switches to Web Speech API
3. Narration **always works** without paid services

### Configuration
```env
# Optional - if not provided, uses Web Speech API
ELEVENLABS_API_KEY=your_api_key
```

Get your free ElevenLabs API key at [elevenlabs.io](https://elevenlabs.io)

## User Flow

1. **Landing Page** → User sees product overview
2. **Sign Up** → Email/Phone + OTP verification + Password creation
3. **Dashboard** → View credits and video history
4. **Create Video** → Paste study material
5. **AI Processing** → Generate summary, video, and quiz
6. **Results** → Watch video and take interactive quiz
7. **Credits** → Purchase more when needed

## API Endpoints

- `POST /api/generate-video` - Generate video from text
- `GET /api/user/credits` - Get user credit information
- `GET /api/videos` - Fetch user's video history

## Database Schema

### Users Table
- `id` - User ID (references auth.users)
- `email` / `phone` - Contact information
- `monthly_credits` - Total monthly allocation (default: 30)
- `credits_used` - Current month usage
- `reset_date` - Next credit reset date

### Videos Table
- `id` - Video ID
- `user_id` - Owner reference
- `title` - Video title
- `input_text` - Original study material
- `summary` - AI-generated summary
- `video_url` - Supabase Storage URL
- `quiz_json` - Quiz questions and answers

## Important Notes

### FFmpeg Installation
The video generation pipeline requires FFmpeg. Make sure it's installed and accessible in your system PATH.

### TTS Integration
The current TTS implementation is a placeholder. For production:
1. Enable Google Cloud TTS API
2. Update `src/lib/tts/google-tts.ts` with actual implementation
3. Uncomment the TTS client code

### Credit System
- Credits reset automatically on the `reset_date`
- Reset logic runs on first API call after reset date
- Purchase functionality is UI-only (no payment integration yet)

### Video Storage
Videos are stored in Supabase Storage bucket named `videos`. Ensure:
- Bucket is created
- Public access is enabled
- RLS policies allow user uploads

## Development Tips

1. **Test with short text** - Start with small study materials during development
2. **Monitor API usage** - Gemini API has rate limits
3. **Check FFmpeg logs** - Video generation errors often come from FFmpeg
4. **Use Supabase logs** - Monitor database queries and auth events

## Troubleshooting

### "Failed to generate video"
- Check FFmpeg installation: `ffmpeg -version`
- Verify Gemini API key is valid
- Check server logs for detailed errors

### "Unauthorized" errors
- Verify Supabase keys in `.env.local`
- Check if user session is active
- Ensure RLS policies are properly set

### Video not playing
- Confirm Supabase Storage bucket is public
- Check video URL is accessible
- Verify FFmpeg successfully created the MP4

## Future Enhancements

- [ ] Real payment integration (Stripe)
- [ ] Advanced video customization
- [ ] Multiple voice options for TTS
- [ ] Video templates and themes
- [ ] Collaborative study groups
- [ ] Mobile app

## License

MIT

## Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ using Next.js, Supabase, and Google AI
