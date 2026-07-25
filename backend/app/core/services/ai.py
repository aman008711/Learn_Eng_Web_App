import asyncio
from typing import AsyncGenerator, List, Dict, Any, Union, Optional
from groq import AsyncGroq
from app.config import settings

# System instructions setting coach persona
COACH_SYSTEM_INSTRUCTION = (
    "You are Jarvis, a supportive, premium, and friendly AI English Coach. "
    "Your role is to help the user practice English conversational skills. "
    "Be extremely encouraging, highlight grammar errors politely and detail corrections, "
    "propose more natural alternatives when relevant, and prompt questions to keep the flow. "
    "Format structural critiques and translations beautifully in markdown. "
    "Keep replies concise, conversational, and tailored to language tutoring."
)

def get_groq_client() -> Optional[AsyncGroq]:
    """
    Configure and instantiate the AsyncGroq Client if a valid key is provided.
    """
    key = settings.GROQ_API_KEY
    if not key or "your-groq-api-key" in key:
        return None
    try:
        return AsyncGroq(api_key=key)
    except Exception:
        return None

async def get_chat_stream(
    message: str, 
    history: List[Any] = None
) -> AsyncGenerator[str, None]:
    """
    Asynchronous generator yielding streamed string responses from Groq Llama 3.3.
    Falls back to a simulated response if Groq is not configured.
    """
    client = get_groq_client()
    
    if client is None:
        # Self-healing simulated response generator
        mock_response = (
            "Hello! I am **Jarvis**, your personal AI English Coach.\n\n"
            "To unlock my real-time AI capabilities, please configure a valid `GROQ_API_KEY` in the [backend/.env](file:///c:/Users/amnk3/Eng%2520Web%2520App/backend/.env) file. "
            "In the meantime, I am running in **Demo Mode** using a local simulated brain. "
            "Let's practice! Here is a tip: when writing English, try to use active verbs to make your sentences sound more descriptive and engaging. "
            "What topic would you like to discuss today?"
        )
        for word in mock_response.split(" "):
            yield word + " "
            await asyncio.sleep(0.08)
    else:
        try:
            # Build OpenAI-compatible chat history messages
            messages = []
            
            # System persona instructions
            messages.append({
                "role": "system",
                "content": COACH_SYSTEM_INSTRUCTION
            })
            
            # Historical turns
            if history:
                for h in history:
                    messages.append({
                        "role": h.role, # "user" or "assistant"
                        "content": h.content
                    })
            
            # Current user prompt
            messages.append({
                "role": "user",
                "content": message
            })

            # Call Groq async chat completions streaming
            completion = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                stream=True,
            )
            
            async for chunk in completion:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
                    
        except Exception as e:
            err_msg = f"Oops! I encountered an error communicating with the AI service: {e}. Please verify your API settings."
            for word in err_msg.split(" "):
                yield word + " "
                await asyncio.sleep(0.08)
