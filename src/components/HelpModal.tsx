'use client'

import { HelpCircle, X } from 'lucide-react'
import { useState } from 'react'

export default function HelpModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50"
        aria-label="עזרה"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">מדריך מהיר</p>
                <h2 className="mt-1 text-xl font-bold text-gray-900">איך המערכת עובדת</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
                aria-label="סגור"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-6 text-gray-700">
              <p className="rounded-2xl border border-cyan-100/70 bg-cyan-50/70 p-4 text-gray-700">
                ברוכים הבאים לג׳ימי, מערכת ההפעלה של היום שלכם. כדי להתחיל, פתחו את הצ׳אט וספרו לג׳ימי במילים
                שלכם על המשימות, ההתחייבויות והמטרות שלכם. המערכת תנתח את המידע, תבנה עבורכם את אבני הבניין
                של היום, ותייצר לו״ז יומי אוטומטי.
              </p>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-gray-900">עוגנים (Anchors)</h3>
                <p className="mt-1 text-gray-600">
                  אירועים קבועים בזמן שלא ניתנים להזזה (כמו פגישות, חוגים, או הוצאת ילדים).
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-gray-900">בלוקים (Blocks)</h3>
                <p className="mt-1 text-gray-600">משימות או פעולות גמישות שצריך לשבץ בזמן הפנוי.</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-gray-900">יעדים ומעקב (Goals & Logs)</h3>
                <p className="mt-1 text-gray-600">
                  מטרות ארוכות טווח שכוללות יומן מעקב דינמי. אתם מעדכנים את ג׳ימי בהתקדמות שלכם בשטח, והמערכת
                  שומרת היסטוריה ומציגה גרף התקדמות.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <h3 className="font-semibold text-gray-900">לו״ז יומי (Daily Schedule)</h3>
                <p className="mt-1 text-gray-600">
                  התכנון שהמערכת מייצרת עבורך בכל בוקר בהתבסס על העוגנים, הבלוקים והיעדים שלך.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
