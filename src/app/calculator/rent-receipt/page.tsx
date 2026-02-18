"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(num: number): string {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " and " + convert(num % 100) : "");
    if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
    if (num < 10000000) return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
    return convert(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + convert(num % 10000000) : "");
  }
  return convert(Math.round(n)) + " Rupees Only";
}

function generateReceipts(
  tenantName: string, landlordName: string, landlordPan: string,
  rent: number, address: string, fromMonth: number, fromYear: number,
  toMonth: number, toYear: number, paymentMode: string
) {
  const receipts: { serial: number; month: string; year: number; date: string }[] = [];
  let serial = 1;
  let m = fromMonth, y = fromYear;
  while (y < toYear || (y === toYear && m <= toMonth)) {
    const lastDay = new Date(y, m, 0).getDate();
    receipts.push({
      serial,
      month: MONTHS[m - 1],
      year: y,
      date: `${lastDay}/${String(m).padStart(2, "0")}/${y}`,
    });
    serial++;
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return receipts;
}

export default function RentReceiptGenerator() {
  const [tenantName, setTenantName] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [landlordPan, setLandlordPan] = useState("");
  const [rent, setRent] = useState("15000");
  const [address, setAddress] = useState("");
  const [fromMonth, setFromMonth] = useState("4");
  const [fromYear, setFromYear] = useState("2025");
  const [toMonth, setToMonth] = useState("3");
  const [toYear, setToYear] = useState("2026");
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [showReceipts, setShowReceipts] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const rentAmount = Number(rent) || 0;
  const annualRent = rentAmount * 12;
  const panRequired = annualRent > 100000;

  const receipts = useMemo(
    () => generateReceipts(tenantName, landlordName, landlordPan, rentAmount, address,
      Number(fromMonth), Number(fromYear), Number(toMonth), Number(toYear), paymentMode),
    [tenantName, landlordName, landlordPan, rentAmount, address, fromMonth, fromYear, toMonth, toYear, paymentMode]
  );

  const canGenerate = tenantName.trim() && landlordName.trim() && rentAmount > 0 && address.trim() &&
    (!panRequired || landlordPan.trim().length === 10);

  function handlePrint() {
    setShowReceipts(true);
    setTimeout(() => window.print(), 300);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Rent Receipt Generator — Free Printable Rent Receipts for HRA",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            url: "https://www.citizennest.com/calculator/rent-receipt",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />

      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .receipt-card { page-break-inside: avoid; margin-bottom: 24px; border: 1px solid #ccc !important; padding: 24px !important; }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="no-print">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          🧾 Rent Receipt <span className="text-orange-600">Generator</span>
        </h1>
        <p className="text-gray-600 mb-6">
          Generate free printable rent receipts for HRA tax exemption claims. Each month gets a separate receipt ready to print or save as PDF.
        </p>

        {/* Inputs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name *</label>
              <input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Landlord Name *</label>
              <input type="text" value={landlordName} onChange={(e) => setLandlordName(e.target.value)}
                placeholder="Landlord's full name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landlord PAN {panRequired ? <span className="text-red-500">* (required — rent &gt;₹1L/year)</span> : "(optional)"}
              </label>
              <input type="text" value={landlordPan} onChange={(e) => setLandlordPan(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDE1234F" maxLength={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (₹) *</label>
              <input type="number" value={rent} onChange={(e) => setRent(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Address *</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Full rental property address"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From (Month/Year)</label>
              <div className="flex gap-2">
                <select value={fromMonth} onChange={(e) => setFromMonth(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <input type="number" value={fromYear} onChange={(e) => setFromYear(e.target.value)}
                  className="w-24 border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To (Month/Year)</label>
              <div className="flex gap-2">
                <select value={toMonth} onChange={(e) => setToMonth(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <input type="number" value={toYear} onChange={(e) => setToYear(e.target.value)}
                  className="w-24 border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>UPI</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button onClick={() => setShowReceipts(true)} disabled={!canGenerate}
              className="px-5 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
              Generate {receipts.length} Receipt{receipts.length !== 1 ? "s" : ""}
            </button>
            {showReceipts && (
              <button onClick={handlePrint}
                className="px-5 py-2.5 border border-orange-600 text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition">
                🖨️ Print / Save PDF
              </button>
            )}
          </div>
          {!canGenerate && tenantName && (
            <p className="text-xs text-red-500 mt-2">Please fill all required fields{panRequired ? " including Landlord PAN (rent exceeds ₹1 lakh/year)" : ""}.</p>
          )}
        </div>

        {/* Summary */}
        {showReceipts && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Summary</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500">Total Receipts</p>
                <p className="text-lg font-bold text-gray-900">{receipts.length}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500">Monthly Rent</p>
                <p className="text-lg font-bold text-gray-900">{fmt(rentAmount)}</p>
              </div>
              <div className="rounded-lg border-2 border-orange-500 bg-orange-50 p-3 text-center">
                <p className="text-xs text-gray-500">Total Rent</p>
                <p className="text-lg font-bold text-orange-600">{fmt(rentAmount * receipts.length)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printable receipts */}
      {showReceipts && (
        <div ref={printRef} className="print-area space-y-6 mb-8">
          {receipts.map((r) => (
            <div key={r.serial} className="receipt-card bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">RENT RECEIPT</h3>
                  <p className="text-xs text-gray-500">Receipt No: {String(r.serial).padStart(3, "0")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">Date: {r.date}</p>
                  <p className="text-xs text-gray-500">{r.month} {r.year}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-700">
                <p>Received a sum of <strong className="text-orange-600">{fmt(rentAmount)}</strong> ({numberToWords(rentAmount)}) from <strong>{tenantName}</strong> towards rent for the month of <strong>{r.month} {r.year}</strong>.</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-sm">
                  <p><span className="text-gray-500">Property:</span> {address}</p>
                  <p><span className="text-gray-500">Payment Mode:</span> {paymentMode}</p>
                  <p><span className="text-gray-500">Landlord:</span> {landlordName}</p>
                  {landlordPan && <p><span className="text-gray-500">Landlord PAN:</span> {landlordPan}</p>}
                </div>
              </div>
              <div className="flex justify-between items-end mt-8 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-400">
                  <p>Revenue Stamp</p>
                  <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded mt-1 flex items-center justify-center text-gray-300 text-xs">₹1</div>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">Signature of Landlord</p>
                  <p className="text-xs text-gray-400">({landlordName})</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cross-links */}
      <div className="no-print flex flex-wrap gap-3 mb-8">
        <Link href="/calculator/emi" className="text-sm text-orange-600 hover:underline">→ EMI Calculator</Link>
        <Link href="/calculator/salary" className="text-sm text-orange-600 hover:underline">→ Salary Calculator</Link>
        <Link href="/calculator/sukanya-samriddhi" className="text-sm text-orange-600 hover:underline">→ Sukanya Samriddhi Calculator</Link>
        <Link href="/calculator/hra-exemption" className="text-sm text-orange-600 hover:underline">→ HRA Calculator</Link>
        <Link href="/calculator" className="text-sm text-orange-600 hover:underline">→ All Calculators</Link>
      </div>

      {/* FAQ */}
      <div className="no-print bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        {[
          ["Why do I need rent receipts?", "Rent receipts are required to claim HRA (House Rent Allowance) exemption under the old tax regime. If your monthly rent exceeds ₹3,000, your employer will ask for rent receipts as proof."],
          ["Is landlord PAN mandatory?", "Landlord PAN is mandatory if your annual rent exceeds ₹1,00,000. If the landlord doesn't have PAN, a declaration from the landlord can be submitted instead."],
          ["Do I need a revenue stamp on rent receipts?", "A revenue stamp of ₹1 is required on rent receipts when payment is made in cash. For digital payments (bank transfer/UPI), a revenue stamp is not mandatory."],
          ["Can I claim HRA under the new tax regime?", "No, HRA exemption is only available under the old tax regime. Under the new regime, you get lower tax rates but cannot claim HRA or most other deductions."],
          ["What if I pay rent to my parents?", "You can pay rent to your parents and claim HRA exemption, provided the house is owned by them and you actually live there. Your parents must show this as rental income in their ITR."],
          ["How much HRA can I claim?", "HRA exemption is the minimum of: actual HRA received, 50% of salary (metro) or 40% (non-metro), or actual rent paid minus 10% of salary."],
        ].map(([q, a]) => (
          <details key={q} className="mb-3 group">
            <summary className="cursor-pointer font-medium text-gray-800 group-open:text-orange-600">{q}</summary>
            <p className="mt-1 text-sm text-gray-600 pl-4">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
