# Quick Setup Guide - Embedding & Vector Store

## 📍 Where to Create .env File

Create the `.env` file in the `documind-backend` directory:

```
documind-backend/
├── .env              ← Create this file here
├── .env.example      ← Template (copy from this)
├── requirements.txt
└── app/
```

## 🔑 How to Get API Keys

### ⚠️ OpenAI API Key Pricing

**Important:** OpenAI is **NOT free** (except for limited free credits):
- **Free Credits**: New accounts get $5-18 in free credits (expires after 3 months)
- **Cost**: ~$0.02 per 1M tokens for text-embedding-3-small
- **Example**: 1,000 documents ≈ $0.01-0.05
- **Pricing**: https://openai.com/pricing

### 💡 Free Alternative: Sentence Transformers (Recommended)

**100% Free, No API Key Needed!**

Instead of OpenAI, you can use **Sentence Transformers** which runs locally and is completely free:

1. **Install:**
   ```bash
   pip install sentence-transformers
   ```

2. **Set in `.env`:**
   ```bash
   EMBEDDING_PROVIDER=sentence-transformers
   # No API key needed!
   ```

3. **Update vector store dimension:**
   ```bash
   PINECONE_DIMENSION=384  # For all-MiniLM-L6-v2 model
   QDRANT_DIMENSION=384
   ```

**See full setup in `docs/INDEXING_EMBEDDING_VERIFICATION.md` under "Free Alternatives"**

### OpenAI API Key (If You Want to Use OpenAI)

1. **Go to:** https://platform.openai.com/api-keys
2. **Sign up** or **log in** to your OpenAI account
3. **Click** "Create new secret key"
4. **Name it** (e.g., "DocuMind Development")
5. **Copy the key** - it starts with `sk-` and looks like: `sk-proj-...`
6. **Important:** You can only see the key once! Save it immediately.

### Cohere API Key (Optional)

1. **Go to:** https://dashboard.cohere.com/api-keys
2. **Sign up** or **log in**
3. **Create** a new API key
4. **Copy** the key

### Google Gemini API Key (Optional)

1. **Go to:** https://makersuite.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click** "Create API Key"
4. **Copy** the key

### Pinecone API Key (Optional - for Cloud Vector Store)

1. **Go to:** https://app.pinecone.io/
2. **Sign up** or **log in**
3. **Navigate** to API Keys section
4. **Create** a new API key
5. **Note** your environment name (e.g., `us-east-1`)

## 📝 Creating .env File

### Windows

1. Open Command Prompt or PowerShell
2. Navigate to the project:
   ```powershell
   cd "C:\Users\Ted Simwa\Desktop\Vanity\IT\my-projects\documind-document-analyzer\documind-backend"
   ```
3. Copy the example file:
   ```powershell
   copy .env.example .env
   ```
4. Open in Notepad:
   ```powershell
   notepad .env
   ```
5. Add your API key:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
6. Save and close

### Mac/Linux

1. Open Terminal
2. Navigate to the project:
   ```bash
   cd documind-backend
   ```
3. Copy the example file:
   ```bash
   cp .env.example .env
   ```
4. Edit the file:
   ```bash
   nano .env
   # or
   vim .env
   ```
5. Add your API key:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
6. Save (Ctrl+X, then Y, then Enter for nano)

## ✅ Minimum Configuration

For a quick start, your `.env` file only needs:

```bash
# Required: OpenAI API Key
OPENAI_API_KEY=sk-your-actual-key-here

# Optional: Vector Store (defaults to chroma if not set)
VECTOR_STORE_PROVIDER=chroma
```

**That's it!** ChromaDB works locally without any additional setup.

## 🧪 Test Your Setup

After creating your `.env` file:

```bash
# From documind-backend directory
python -c "from app.core.config import settings; print(f'✅ Embedding Provider: {settings.EMBEDDING_PROVIDER}'); print(f'✅ Vector Store: {settings.VECTOR_STORE_PROVIDER}')"
```

If you see the output, your configuration is loaded correctly!

## ❓ Troubleshooting

**"API key is required" error:**
- Check that `.env` file is in `documind-backend/` directory
- Verify the key is correct (no extra spaces, no quotes)
- Restart your application after changing `.env`

**".env file not found":**
- Make sure you're in the `documind-backend` directory
- Check the file is named exactly `.env` (not `.env.txt`)
- On Windows, ensure file extensions are visible

**Need more help?** See the full documentation in `docs/INDEXING_EMBEDDING_VERIFICATION.md`

