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

async def get_daily_word(date_seed: str) -> Dict[str, Any]:
    """
    Generate a dynamic Word of the Day using Groq JSON mode.
    Falls back to a curated weekly list if Groq is not configured.
    """
    client = get_groq_client()
    
    if client is None:
        # Weekly curated offline fallbacks based on date_seed day of the week
        import hashlib
        h = int(hashlib.md5(date_seed.encode('utf-8')).hexdigest(), 16)
        day_idx = h % 7
        
        fallback_words = [
            {
                "word": "Eloquent",
                "meaning": "Fluent or persuasive in speaking or writing.",
                "pronunciation": "/ˈel.ə.kwənt/",
                "synonyms": ["expressive", "articulate", "persuasive", "silver-tongued"],
                "antonyms": ["inarticulate", "silent", "hesitant", "stammering"],
                "examples": [
                    "She made an eloquent appeal for action on climate change.",
                    "An eloquent speech that moved the audience to tears.",
                    "He was eloquent in his defense of public education."
                ]
            },
            {
                "word": "Pragmatic",
                "meaning": "Dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.",
                "pronunciation": "/præɡˈmæt.ɪk/",
                "synonyms": ["practical", "realistic", "down-to-earth", "sensible"],
                "antonyms": ["idealistic", "theoretical", "impractical", "visionary"],
                "examples": [
                    "A pragmatic approach to solving the city's housing shortage.",
                    "She remains pragmatic about the project's chances of success.",
                    "We need to find a pragmatic solution rather than arguing over rules."
                ]
            },
            {
                "word": "Resilient",
                "meaning": "Able to withstand or recover quickly from difficult conditions.",
                "pronunciation": "/rɪˈzɪl.jənt/",
                "synonyms": ["strong", "tough", "hardy", "rebounding"],
                "antonyms": ["vulnerable", "fragile", "weak", "delicate"],
                "examples": [
                    "The community proved incredibly resilient after the hurricane.",
                    "A resilient economy that continues to grow despite inflation.",
                    "Kids are often more resilient to sudden changes than adults."
                ]
            },
            {
                "word": "Meticulous",
                "meaning": "Showing great attention to detail; very careful and precise.",
                "pronunciation": "/məˈtɪk.jə.ləs/",
                "synonyms": ["precise", "detailed", "careful", "scrupulous"],
                "antonyms": ["careless", "sloppy", "slapdash", "negligent"],
                "examples": [
                    "He was meticulous in his preparation for the exam.",
                    "The painting required weeks of meticulous restoration work.",
                    "She kept meticulous financial records for the organization."
                ]
            },
            {
                "word": "Cognizant",
                "meaning": "Having knowledge or being aware of.",
                "pronunciation": "/ˈkɒɡ.nɪ.zənt/",
                "synonyms": ["aware", "mindful", "conscious", "informed"],
                "antonyms": ["unaware", "ignorant", "oblivious", "unmindful"],
                "examples": [
                    "Statesmen must be cognizant of political realities.",
                    "We are fully cognizant of the risks involved in this merger.",
                    "She was cognizant of the fact that time was running out."
                ]
            },
            {
                "word": "Ephemeral",
                "meaning": "Lasting for a very short time.",
                "pronunciation": "/ɪˈfem.ər.əl/",
                "synonyms": ["temporary", "transitory", "fleeting", "short-lived"],
                "antonyms": ["permanent", "eternal", "lasting", "enduring"],
                "examples": [
                    "Fashions are ephemeral, but true classic style endures.",
                    "The morning dew created an ephemeral sparkle on the grass.",
                    "Social media trends are often ephemeral and quickly forgotten."
                ]
            },
            {
                "word": "Ubiquitous",
                "meaning": "Present, appearing, or found everywhere.",
                "pronunciation": "/juːˈbɪk.wɪ.təs/",
                "synonyms": ["omnipresent", "widespread", "pervasive", "ever-present"],
                "antonyms": ["rare", "scarce", "uncommon", "infrequent"],
                "examples": [
                    "Smartphones have become ubiquitous in modern society.",
                    "The ubiquitous influence of advertising in cities.",
                    "Coffee shops seem to be ubiquitous in this neighborhood."
                ]
            }
        ]
        
        await asyncio.sleep(0.5)
        return fallback_words[day_idx]

    try:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are Jarvis, a professional vocabulary expert. Generate a 'Word of the Day' for learning English. "
                    "It must be an interesting, intermediate-to-advanced vocabulary word (e.g. academic, literary, or business English). "
                    "You must output your analysis STRICTLY as a JSON object with the following keys:\n"
                    "1. 'word': The vocabulary word.\n"
                    "2. 'meaning': A clear definition of the word.\n"
                    "3. 'pronunciation': The phonetic spelling (IPA) (e.g. '/ˌephemeral/').\n"
                    "4. 'synonyms': A list of 3-4 synonyms.\n"
                    "5. 'antonyms': A list of 3-4 antonyms.\n"
                    "6. 'examples': A list of 3 example sentences demonstrating the word in context.\n"
                    f"Use the date seed '{date_seed}' to determine the word so it is consistent for that date."
                )
            },
            {
                "role": "user",
                "content": "Generate today's word."
            }
        ]
        
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            response_format={"type": "json_object"}
        )
        
        import json
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        return {
            "word": "Eloquent",
            "meaning": f"Fluent or persuasive in speaking or writing. (Generated with error: {e})",
            "pronunciation": "/ˈel.ə.kwənt/",
            "synonyms": ["expressive", "articulate"],
            "antonyms": ["inarticulate"],
            "examples": ["She made an eloquent speech."]
        }

async def get_vocab_quiz(words: List[str] = None) -> Dict[str, Any]:
    """
    Generate a 5-question multiple choice vocabulary quiz using Groq JSON mode.
    Falls back to a curated offline quiz if Groq is not configured.
    """
    client = get_groq_client()
    
    if client is None:
        mock_quiz = {
            "questions": [
                {
                    "question": "What is the meaning of the word 'Ephemeral'?",
                    "options": [
                        "Lasting for a very long time",
                        "Lasting for a very short time",
                        "Appearing everywhere at once",
                        "Showing great attention to detail"
                    ],
                    "correct_answer": 1,
                    "explanation": "Ephemeral comes from the Greek word 'ephemeros', meaning 'lasting only a day'. It describes something fleeting or short-lived."
                },
                {
                    "question": "Choose the correct synonym for 'Meticulous':",
                    "options": [
                        "Sloppy",
                        "Careful and precise",
                        "Hasty and fast",
                        "Mindful of others"
                    ],
                    "correct_answer": 1,
                    "explanation": "Meticulous means showing great attention to detail; very careful and precise."
                },
                {
                    "question": "Complete the sentence: 'Smartphones have become so ___ that almost everyone owns one.'",
                    "options": [
                        "ubiquitous",
                        "ephemeral",
                        "pragmatic",
                        "eloquent"
                    ],
                    "correct_answer": 0,
                    "explanation": "Ubiquitous means present, appearing, or found everywhere."
                },
                {
                    "question": "What is the antonym of 'Pragmatic'?",
                    "options": [
                        "Realistic",
                        "Practical",
                        "Idealistic",
                        "Sensible"
                    ],
                    "correct_answer": 2,
                    "explanation": "Pragmatic means dealing with things practically rather than theoretically. Idealistic, focusing on high principles or theories, is its antonym."
                },
                {
                    "question": "What does it mean to be 'Cognizant' of something?",
                    "options": [
                        "To be completely unaware",
                        "To have knowledge or awareness of it",
                        "To actively disagree with it",
                        "To be confused by it"
                    ],
                    "correct_answer": 1,
                    "explanation": "Cognizant is an adjective that means having knowledge or being aware of something."
                }
            ]
        }
        await asyncio.sleep(0.5)
        return mock_quiz

    try:
        words_context = ""
        if words:
            words_context = f" Focus the quiz questions on these words: {', '.join(words)}."
            
        messages = [
            {
                "role": "system",
                "content": (
                    "You are Jarvis, a professional vocabulary quiz developer. Generate an interactive vocabulary multiple-choice quiz of 5 questions."
                    f"{words_context} Otherwise, test general advanced English vocabulary.\n"
                    "You must return your quiz STRICTLY as a JSON object with a single key 'questions', which is a list of 5 objects. Each object must have the following keys:\n"
                    "1. 'question': The question text (e.g. 'What is the meaning of [Word]?' or a contextual sentence with a blank like 'The speaker was so ___ that everyone listened.').\n"
                    "2. 'options': A list of exactly 4 options.\n"
                    "3. 'correct_answer': The index of the correct option (0-3).\n"
                    "4. 'explanation': A brief explanation of why that option is correct."
                )
            },
            {
                "role": "user",
                "content": "Generate the quiz."
            }
        ]
        
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            response_format={"type": "json_object"}
        )
        
        import json
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        return {
            "questions": [
                {
                    "question": f"Which word means 'lasting for a very short time' (Error fallback: {e})?",
                    "options": ["Ubiquitous", "Ephemeral", "Meticulous", "Eloquent"],
                    "correct_answer": 1,
                    "explanation": "Ephemeral describes something short-lived."
                }
            ]
        }

