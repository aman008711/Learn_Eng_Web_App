import asyncio
from typing import AsyncGenerator, List, Dict, Any, Union, Optional
import google.generativeai as genai
from app.config import settings

def get_gemini_model() -> Optional[genai.GenerativeModel]:
    """
    Configure and instantiate the Gemini model if a valid key is provided.
    """
    key = settings.GEMINI_API_KEY
    if not key or "your-google-gemini" in key:
        return None
    try:
        genai.configure(api_key=key)
        # Define coach persona system instructions
        system_instruction = (
            "You are Jarvis, a supportive, premium, and friendly AI English Coach. "
            "Your role is to help the user practice English conversational skills. "
            "Be extremely encouraging, highlight grammar errors politely and detail corrections, "
            "propose more natural alternatives when relevant, and prompt questions to keep the flow. "
            "Format structural critiques and translations beautifully in markdown. "
            "Keep replies concise, conversational, and tailored to language tutoring."
        )
        return genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction
        )
    except Exception:
        return None

async def get_chat_stream(
    message: str, 
    history: List[Any] = None
) -> AsyncGenerator[str, None]:
    """
    Asynchronous generator yielding streamed string responses.
    Falls back to a simulated response if Gemini is not configured.
    """
    model = get_gemini_model()
    
    if model is None:
        # Self-healing simulated response generator
        mock_response = (
            "Hello! I am **Jarvis**, your personal AI English Coach.\n\n"
            "To unlock my real-time AI capabilities, please configure a valid `GEMINI_API_KEY` in the [backend/.env](file:///c:/Users/amnk3/Eng%20Web%20App/backend/.env) file. "
            "In the meantime, I am running in **Demo Mode** using a local simulated brain. "
            "Let's practice! Here is a tip: when writing English, try to use active verbs to make your sentences sound more descriptive and engaging. "
            "What topic would you like to discuss today?"
        )
        for word in mock_response.split(" "):
            yield word + " "
            await asyncio.sleep(0.08)
    else:
        try:
            # Build chat history parts
            contents = []
            if history:
                for h in history:
                    role = "model" if h.role == "assistant" else "user"
                    contents.append({
                        "role": role,
                        "parts": [h.content]
                    })
            
            # Append current user prompt
            contents.append({
                "role": "user",
                "parts": [message]
            })

            # Call stream generating content
            response = model.generate_content(contents, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                await asyncio.sleep(0.01)
        except Exception as e:
            err_msg = f"Oops! I encountered an error communicating with the AI service: {e}. Please verify your API settings."
            for word in err_msg.split(" "):
                yield word + " "
                await asyncio.sleep(0.08)
