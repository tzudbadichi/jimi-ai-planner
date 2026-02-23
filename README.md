# Jimi - Personal AI Assistant & Automation Hub

Jimi is a personal dashboard and automation center designed to manage daily tasks, monitor background processes, and visualize system health. It combines a chat interface for natural language interaction with a structured dashboard for tracking anchors (habits/events) and automated scripts.

## 🚀 Key Features

* **Smart Dashboard:** A split-screen layout featuring:
    * **Chat Interface:** Real-time communication with the AI assistant.
    * **Process Monitor:** Visual grid of automation scripts (Python/Node.js) with status indicators (Success/Failure/Running).
    * **Anchors & Habits:** Tracking of daily routines and time-based events.
    * **Schedule Builder:** Dynamic daily planning area.

* **Automation Engine:**
    * Executes scripts and logs their output to a PostgreSQL database.
    * Tracks execution time, status, and error logs.
    * Provides visual feedback on process health (green/red indicators).

* **Tech Stack:**
    * **Frontend:** Next.js 14+ (App Router), Tailwind CSS, Lucide React (Icons).
    * **Backend:** Server Actions, Prisma ORM.
    * **Database:** PostgreSQL (via Neon/Supabase or local).
    * **AI Integration:** (Planned) Google Gemini / OpenAI API for context-aware responses.

## 📂 Project Structure

├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── dashboard/      # Main dashboard view
│   │   ├── actions.ts      # Server Actions (DB operations)
│   ├── components/         # React UI components
│   │   ├── ChatArea.tsx    # Chat interface logic
│   │   ├── ProcessGrid.tsx # Automation status cards
│   │   ├── AnchorsSidebar.tsx # Daily habits tracking
│   ├── lib/
│   │   ├── db.ts           # Prisma client instance
│   │   ├── utils.ts        # Helper functions
├── prisma/
│   ├── schema.prisma       # Database schema definition
├── public/                 # Static assets


## 🛠️ Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/jimi.git](https://github.com/your-username/jimi.git)
    cd jimi
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory and add your database connection string:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/jimi_db"
    ```

4.  **Database Migration:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## 📌 Roadmap & TODO

* [ ] **Interactive Process Logs:** Click on a process card to view detailed logs and history graphs.
* [ ] **Schedule Builder Logic:** Implement the AI logic to generate a daily schedule based on tasks and anchors.
* [ ] **Mobile Responsiveness:** Optimize the layout for phone screens.
* [ ] **Voice Command:** Integration for voice-to-text input.

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

---
*Built with ❤️ by Zvi Yehuda & Gemini*