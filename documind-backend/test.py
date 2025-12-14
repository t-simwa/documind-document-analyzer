from google import genai

client = genai.Client(api_key="AIzaSyC6VIKle4i1ZeWbFVAxXkDcM8j_pzFPhqA")

response = client.models.generate_content(
    model="gemini-2.5-flash", contents="Explain how AI works in three paragraphs"
)
print(response.text)