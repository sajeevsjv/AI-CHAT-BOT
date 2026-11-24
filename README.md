# 🤖 Reveforge AI Chatbot

An intelligent AI-powered chatbot built using the MERN stack, Google Gemini API, and Retrieval-Augmented Generation (RAG). It answers user questions using information extracted from the official [Reveforge website](https://reveforge.com).

The application uses MongoDB Atlas Vector Search to retrieve relevant information and Google Gemini to generate context-aware responses.

## ✨ Features

- **AI-Powered Conversations:** Generate natural-language responses using Google Gemini.
- **RAG Architecture:** Retrieve relevant website content before generating answers.
- **Semantic Search:** Find relevant information using vector embeddings and MongoDB Atlas Vector Search.
- **Website Content Ingestion:** Automatically extract and process content from the Reveforge website sitemap.
- **Conversation Management:** Create, retrieve, and delete chat conversations.
- **Chat History:** Retrieve previous messages from conversations.
- **Source References:** Provide source links for retrieved information.
- **Multilingual Support:** Respond in English, Malayalam, and Manglish.
- **Context-Aware Responses:** Use previous conversation messages to understand follow-up questions.
- **Fallback Models:** Switch between configured Gemini models when temporary API errors occur.

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS 4
- Axios

### Backend
- Node.js
- Express.js 5
- MongoDB
- Mongoose
- Google GenAI SDK

### AI & RAG
- Google Gemini API
- Gemini Embeddings
- MongoDB Atlas Vector Search
- Retrieval-Augmented Generation (RAG)
- Cheerio (Website Content Extraction)

## 🏗️ Project Structure

```text
AI-CHAT-BOT/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── controllers/
│   ├── db/
│   │   ├── models/
│   │   └── mongoConnect.js
│   │
│   ├── routes/
│   │   └── chatRoutes.js
│   │
│   ├── services/
│   │   ├── geminiService.js
│   │   ├── embeddingService.js
│   │   └── ragService.js
│   │
│   ├── scripts/
│   │   └── ingest.js
│   │
│   ├── app.js
│   └── package.json
│
└── README.md
```

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/sajeevsjv/AI-CHAT-BOT.git

cd AI-CHAT-BOT
```

### 2. Backend Setup

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
pnpm install
```

Create a `.env` file inside the server directory:

```env
PORT=3000

MONGODB_ATLAS_URI=your_mongodb_atlas_connection_string

GEMINI_API_KEY=your_google_gemini_api_key

GEMINI_MODEL=gemini-3.5-flash-lite
```

Replace the placeholder values with your actual credentials.

Start the backend:

```bash
pnpm dev
```

Backend runs at:

`http://localhost:3000`

### 3. Frontend Setup

Open another terminal:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

The frontend runs at:

`http://localhost:5173`

## 🧠 RAG Implementation

This project uses Retrieval-Augmented Generation (RAG) to provide answers based on Reveforge website content.

### How RAG Works

1. **Data Ingestion:** Extract website content from the Reveforge sitemap.
2. **Content Processing:** Clean the extracted HTML and divide content into smaller chunks.
3. **Embedding Generation:** Convert text chunks into numerical vector representations using Google's Gemini embedding model.
4. **Vector Storage:** Store the generated embeddings and associated content in MongoDB.
5. **Semantic Retrieval:** Convert the user's question into an embedding and search for relevant content using MongoDB Atlas Vector Search.
6. **Context Generation:** Pass the retrieved content and conversation history to Gemini.
7. **AI Response:** Generate an answer based on the retrieved website information.

### RAG Architecture

```text
        Reveforge Website
                |
                v
          Sitemap Fetch
                |
                v
         HTML Extraction
                |
                v
          Text Chunking
                |
                v
       Gemini Embeddings
                |
                v
       MongoDB Atlas
       Vector Database
                |
                |
      USER ASKS A QUESTION
                |
                v
       Generate Query Embedding
                |
                v
       MongoDB Vector Search
                |
                v
       Retrieve Relevant Context
                |
                v
        Google Gemini API
                |
                v
        Generated Answer
                |
                v
          Chat Interface
```

## 📥 Knowledge Base Ingestion

The project includes an ingestion script that extracts content from the Reveforge website and stores its embeddings in MongoDB Atlas.

Run the following command from the server directory:

```bash
pnpm ingest
```

To preview the extracted content without saving anything:

```bash
pnpm ingest -- --dry-run
```

The ingestion process:
- Fetches URLs from the website sitemap.
- Extracts and cleans website content.
- Divides content into smaller sections.
- Generates embeddings.
- Stores new or modified sections in MongoDB.
- Removes outdated sections.
- Creates and checks the MongoDB Vector Search index.

**Note:** The MongoDB Atlas cluster must support Vector Search. The ingestion script creates the required vector index automatically.

## 🔌 API Endpoints

Base URL: `http://localhost:3000/api/chat`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/send-message` | Send a message to the AI chatbot |
| GET | `/conversations` | Retrieve conversations |
| GET | `/conversations/:id/messages` | Retrieve conversation messages |
| DELETE | `/conversations/:id` | Delete a conversation |

## 🔑 Required API Credentials

- **MongoDB Atlas:** Database connection and vector search.
- **Google Gemini API:** AI response generation and text embeddings.

Get your Gemini API key from:

https://aistudio.google.com/apikey

MongoDB Atlas:

https://www.mongodb.com/products/platform/atlas-database

## 🚀 Future Improvements

- Streaming AI responses.
- Improved conversation memory.
- Document and PDF-based knowledge ingestion.
- Support for multiple knowledge sources.
- Advanced RAG evaluation and optimization.
- Improved authentication and user management.

## 👨‍💻 Author

**Sajeev T.**

MERN Stack Developer | AI Enthusiast

GitHub: https://github.com/sajeevsjv

---

⭐ If you find this project interesting, consider giving it a star!
