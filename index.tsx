import { GoogleGenAI, Type } from "@google/genai";

const root = document.getElementById('root');

// --- Create App Structure ---
if (root) {
  root.innerHTML = `
    <header>
      <h1>دستیار آموزشی حسابداری</h1>
      <p>ماهیت حساب‌ها را به سادگی یاد بگیرید</p>
    </header>
    <main>
      <form class="input-form" id="analysis-form">
        <input
          type="text"
          id="search-term"
          placeholder="نام حساب یا رویداد مالی را وارد کنید (مثال: خرید اثاثه)"
          aria-label="نام حساب یا رویداد مالی"
        />
        <button type="submit" id="submit-button">
          تحلیل کن
        </button>
      </form>
      <div class="result-container" id="result-container">
        <div class="initial-state">
          <p>برای شروع، نام یک حساب (مانند "موجودی نقد") یا یک رویداد مالی (مانند "پرداخت اجاره") را وارد کرده و دکمه "تحلیل کن" را بزنید.</p>
        </div>
      </div>
    </main>
  `;
}

// --- App Logic ---
const form = document.getElementById('analysis-form');
const input = document.getElementById('search-term') as HTMLInputElement | null;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement | null;
const resultContainer = document.getElementById('result-container');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const searchTerm = input?.value.trim();
  if (!searchTerm || submitButton?.disabled) {
    return;
  }

  // Set loading state
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = 'در حال تحلیل...';
  }
  if (resultContainer) {
    resultContainer.innerHTML = '<div class="loader" aria-label="در حال بارگذاری"></div>';
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const systemInstruction = 'تو یک دستیار آموزشی حرفه‌ای حسابداری هستی. وظیفه تو این است که ماهیت حساب‌ها را به دانشجویان آموزش دهی. ورودی تو نام یک حساب یا رویداد مالی است. خروجی باید یک آبجکت JSON باشد که شامل این کلیدهاست: "accountName", "accountType", "nature", "explanation", و "practicalTip". مطمئن شو که خروجی فقط و فقط یک آبجکت JSON معتبر باشد بدون هیچ کاراکتر اضافی یا فرمت markdown.';

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        accountName: { type: Type.STRING, description: 'نام حساب یا رویدادی که تحلیل شد' },
        accountType: { type: Type.STRING, description: 'نوع حساب: دارایی، بدهی، سرمایه، درآمد یا هزینه' },
        nature: { type: Type.STRING, description: 'ماهیت حساب: بدهکار یا بستانکار' },
        explanation: { type: Type.STRING, description: 'توضیح کوتاه و ساده درباره ماهیت حساب' },
        practicalTip: { type: Type.STRING, description: 'یک نکته عملی برای استفاده در سند حسابداری' }
      },
      required: ['accountName', 'accountType', 'nature', 'explanation', 'practicalTip']
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${systemInstruction}\n\nورودی: "${searchTerm}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    if (resultContainer) {
      resultContainer.innerHTML = `
        <div class="result-card">
          <table class="result-table" aria-live="polite">
            <tbody>
              <tr>
                <th>نام حساب/رویداد</th>
                <td>${result.accountName}</td>
              </tr>
              <tr>
                <th>نوع حساب</th>
                <td>${result.accountType}</td>
              </tr>
              <tr>
                <th>ماهیت</th>
                <td>${result.nature}</td>
              </tr>
              <tr>
                <th>توضیح</th>
                <td>${result.explanation}</td>
              </tr>
            </tbody>
          </table>
          <div class="practical-tip">
            <h3>💡 نکته عملی</h3>
            <p>${result.practicalTip}</p>
          </div>
        </div>
      `;
    }

  } catch (err) {
    console.error(err);
    if (resultContainer) {
      resultContainer.innerHTML = '<div class="error-message" role="alert">خطایی در تحلیل درخواست رخ داد. لطفاً دوباره تلاش کنید.</div>';
    }
  } finally {
    // Reset loading state
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = 'تحلیل کن';
    }
  }
});
