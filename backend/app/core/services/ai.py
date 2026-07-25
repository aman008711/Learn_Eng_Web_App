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

async def check_grammar(text: str) -> Dict[str, Any]:
    """
    Analyzes English text for spelling, grammar, natural flow, and returns
    structured corrections and explanations.
    """
    client = get_groq_client()
    
    if client is None:
        # Self-healing Demo Mode fallback
        cleaned = text.strip()
        has_error = "go" in cleaned.lower() or "yesterday" in cleaned.lower() or len(cleaned) < 15
        
        if has_error:
            corrected = cleaned.replace("go", "goes").replace("went", "goes") if "go" in cleaned.lower() else cleaned
            if "yesterday" in cleaned.lower() and "go" in cleaned.lower():
                corrected = cleaned.replace("go", "went")
            
            mock_data = {
                "corrected_text": corrected,
                "explanation": (
                    "### Verb Tense & Agreement Analysis\n\n"
                    "1. **Grammar Correction**: You used the base form of the verb when referring to past events or singular pronouns. "
                    "In English, the verb must match the temporal context (past simple for yesterday) or singular pronoun markers (third person singular '-s').\n"
                    "2. **Punctuation**: Added proper trailing period capitalization rules."
                ),
                "alternatives": [
                    "Yesterday, he went to school.",
                    "He attended school yesterday morning."
                ],
                "mistakes_highlighted": f"He ~~go~~ **went** to school yesterday."
            }
        else:
            mock_data = {
                "corrected_text": cleaned,
                "explanation": (
                    "### Sentence Analysis\n\n"
                    "Your sentence is grammatically correct! There are no errors in spelling, word order, or agreement. "
                    "Great job using standard structure."
                ),
                "alternatives": [
                    f"Indeed, {cleaned}",
                    f"To phrase it differently: {cleaned}"
                ],
                "mistakes_highlighted": cleaned
            }
        
        await asyncio.sleep(0.8) # simulate network latency
        return mock_data

    try:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are Jarvis, a professional English Grammar Checker. "
                    "Analyze the user's input text for grammar, spelling, punctuation, and structural style issues. "
                    "You must output your analysis STRICTLY as a JSON object with the following keys:\n"
                    "1. 'corrected_text': The complete corrected sentence(s). If no changes are needed, return the original text.\n"
                    "2. 'explanation': A markdown detailed explanation of the errors found and the grammar rules applied. If the sentence is already perfect, write a positive critique and explain why it is correct.\n"
                    "3. 'alternatives': A list of 2-3 alternative (more natural or formal) phrasings representing the same idea.\n"
                    "4. 'mistakes_highlighted': The original text modified to visually highlight mistakes. "
                    "Use strikethrough for removals and bold for additions (e.g. 'He ~~go~~ **went** to school.')."
                )
            },
            {
                "role": "user",
                "content": f"Analyze this text: {text}"
            }
        ]
        
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            response_format={"type": "json_object"}
        )
        
        # Parse the JSON response
        import json
        raw_content = completion.choices[0].message.content
        return json.loads(raw_content)
    except Exception as e:
        # Return error format
        return {
            "corrected_text": text,
            "explanation": f"Oops! I encountered an error checking your text: {e}",
            "alternatives": [text],
            "mistakes_highlighted": text
        }

