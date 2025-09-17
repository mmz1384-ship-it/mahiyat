import React, { useState } from "react";

const App = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // جدول کامل ماهیت حساب‌ها
  const accountTable = [
    { name: "صندوق", type: "دارایی", nature: "بدهکار" },
    { name: "بانک", type: "دارایی", nature: "بدهکار" },
    { name: "فروش", type: "درآمد", nature: "بستانکار" },
    { name: "هزینه", type: "هزینه", nature: "بدهکار" },
    { name: "سرمایه", type: "حقوق صاحبان سرمایه", nature: "بستانکار" },
    { name: "بدهی کوتاه مدت", type: "بدهی", nature: "بستانکار" },
    // می‌تونی حساب‌های بیشتری هم اضافه کنی
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults("");

    try {
      // --- استفاده از Gemini API ---
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
          process.env.GEMINI_API_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `توضیح کوتاه درباره ${query} در حسابداری` }] }],
          }),
        }
      );

      let output = "";
      if (response.ok) {
        const data = await response.json();
        output =
          data?.candidates?.[0]?.content?.[0]?.text ||
          accountTable.filter((item) => item.name.includes(query)).map(i => `${i.name} (${i.type}) - ${i.nature}`).join("\n");
      } else {
        output =
          accountTable.filter((item) => item.name.includes(query)).map(i => `${i.name} (${i.type}) - ${i.nature}`).join("\n");
      }

      setResults(output);
    } catch (err) {
      console.error(err);
      // اگر خطا بود، fallback روی جدول
      const fallback = accountTable.filter((item) => item.name.includes(query)).map(i => `${i.name} (${i.type}) - ${i.nature}`).join("\n");
      setResults(fallback || "نتیجه‌ای پیدا نشد.");
      setError("خطا در جستجو، از داده جدول استفاده شد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Tahoma, sans-serif" }}>
      <h1>آموزش ماهیت حساب‌ها</h1>
      <input
        type="text"
        placeholder="یک کلمه وارد کنید"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "10px", width: "300px", marginRight: "10px" }}
      />
      <button onClick={handleSearch} style={{ padding: "10px 20px" }}>
        جستجو
      </button>

      {loading && <p>در حال دریافت پاسخ...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {results && (
        <div style={{ marginTop: "20px", background: "#f5f5f5", padding: "10px", whiteSpace: "pre-line" }}>
          <strong>نتیجه:</strong>
          <p>{results}</p>
        </div>
      )}
    </div>
  );
};

export default App;
