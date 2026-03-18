'use client'

import { HelpCircle, ChevronDown, X } from 'lucide-react'
import { useState } from 'react'

const helpSections = [
  {
    title: 'עוגנים קבועים',
    description:
      'אירועים קשיחים בזמן שלא ניתנים להזזה, כגון פגישות, חוגים או שעות איסוף ילדים ממסגרות. הם מהווים את השלד הבלתי משתנה של הזמן שלכם.',
  },
  {
    title: 'יעדים פעילים',
    description:
      'מטרות מתמשכות וארוכות טווח. קיים יומן מעקב (לוג) דינמי המובנה במערכת עבור יעדים אלו. כשאתם מדווחים לג\'ימי דרך הצ\'אט על התקדמות בשטח, המערכת מתעדת את הנתונים ומייצרת גרף התקדמות ויזואלי המאפשר לכם לעקוב אחר המגמה שלכם לאורך זמן.',
  },
  {
    title: 'רשימות',
    description:
      'פשוט רשימות. מיועד לניהול רשימת קניות, רשימת ציוד, או כל אוסף פריטים אחר שתרצו לשמור ולנהל.',
  },
  {
    title: 'לו"ז יומי / שבועי',
    description:
      'תוכנית הפעולה שלכם. המערכת מייצרת את הלו"ז אוטומטית על ידי לקיחת העוגנים הקבועים, ושיבוץ המשימות, היעדים והפעולות שלכם ביניהם בהתאם לזמן הפנוי שנותר.',
  },
]

export default function HelpModal() {
  const [open, setOpen] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 backdrop-blur-sm md:items-center md:p-4">
          <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">Guide</p>
                <h2 className="mt-1 text-xl font-bold text-gray-900">איך עובדים עם ג'ימי</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
                aria-label="סגור"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 pb-5 pt-4 md:px-6 md:pb-6">
              <p className="rounded-3xl border border-cyan-100 bg-cyan-50/80 px-4 py-4 text-sm leading-7 text-gray-700 md:px-5 md:text-[15px]">
                ברוכים הבאים לג'ימי, מערכת ההפעלה שלכם. כל פעולה במערכת מתבצעת ישירות דרך הצ'אט. פשוט ספרו לג'ימי
                במילים שלכם על המשימות, ההתחייבויות והמטרות שלכם, והוא ינתח את המידע ויבנה עבורכם אוטומטית לו"ז
                יומי או לו"ז שבועי. גם במהלך היום, אתם יכולים לדווח לג'ימי על משימות שסיימתם, התקדמות ביעדים, או
                לעדכן אותו בשינויים בזמן אמת.
              </p>

              <div className="mt-4 space-y-3">
                {helpSections.map((section, index) => {
                  const isExpanded = expandedIndex === index

                  return (
                    <div
                      key={section.title}
                      className="overflow-hidden rounded-3xl border border-gray-100 bg-slate-50/75 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-right md:px-5"
                        aria-expanded={isExpanded}
                      >
                        <span className="text-base font-semibold text-gray-900">{section.title}</span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <div
                        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="px-4 pb-4 text-sm leading-7 text-gray-600 md:px-5 md:pb-5 md:text-[15px]">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
