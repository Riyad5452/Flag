const company = {
  name: "Hungerstation",
  address: "25th Street, Al-Thuqbah, Al Khobar 34625"
};

const users = [
  { id: "admin", password: "admin123", role: "admin", name: "Payroll Admin" },
  { id: "EMP001", password: "emp123", role: "employee", name: "Ahmed Ali" },
  { id: "EMP002", password: "emp123", role: "employee", name: "Mohamed Hassan" }
];

const defaultPayslips = [
  {
    employeeId: "EMP002",
    month: "2025-02",
    name: "Mohamed Hassan",
    iqama: "2345678901",
    passport: "B23456789",
    nationality: "Egyptian",
    joinDate: "2024-02-01",
    vehicleType: "Bike",
    bankName: "Riyad Bank",
    accountNumber: "SA2345678901234567890123",
    earnings: [
      ["Category", 200],
      ["VDA", 400],
      ["Orders (572 × 8)", 4576],
      ["KM (300 × 0.9)", 270],
      ["Eid Ul Adha Bonus", 40]
    ],
    deductions: [
      ["Bonus", 60],
      ["Adjustment (+)", 480],
      ["Reject Order Penalty", 650],
      ["Double Order Penalty", 200],
      ["Wallet", 1000],
      ["Car/Bike Installment", 1000]
    ],
    loans: [
      ["2025-02-01", "Loan Taken", 1500, 1500, "-", "Loan Approved"],
      ["2025-02-15", "Loan Payment", 500, 1000, "+", "Monthly Payment"],
      ["2025-02-28", "Loan Payment", 500, 500, "+", "Monthly Payment"],
      ["2025-03-15", "Loan Payment", 500, 0, "+", "Loan Fully Paid"]
    ]
  },
  {
    employeeId: "EMP001",
    month: "2025-02",
    name: "Ahmed Ali",
    iqama: "1234567890",
    passport: "A12345678",
    nationality: "Saudi",
    joinDate: "2023-11-10",
    vehicleType: "Car",
    bankName: "Al Rajhi Bank",
    accountNumber: "SA9876543210987654321098",
    earnings: [["Category", 300], ["VDA", 450], ["Orders (410 × 8)", 3280], ["KM (220 × 0.9)", 198]],
    deductions: [["Wallet", 400], ["Adjustment (-)", 100]],
    loans: []
  }
];

const state = {
  currentUser: null,
  payslips: JSON.parse(localStorage.getItem("payslips")) || defaultPayslips
};

const $ = (selector) => document.querySelector(selector);
const money = (value) => Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthName = (month) => new Date(`${month}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
const sum = (rows) => rows.reduce((total, row) => total + Number(row[1] || 0), 0);

function saveState() {
  localStorage.setItem("payslips", JSON.stringify(state.payslips));
}

function visiblePayslips() {
  if (state.currentUser.role === "admin") return state.payslips;
  return state.payslips.filter((slip) => slip.employeeId === state.currentUser.id);
}

function renderSelectors() {
  const employees = [...new Map(state.payslips.map((slip) => [slip.employeeId, slip])).values()];
  const employeeOptions = employees.map((slip) => `<option value="${slip.employeeId}">${slip.employeeId} - ${slip.name}</option>`).join("");
  $("#employeeList").innerHTML = employeeOptions;
  $("#viewEmployeeSelect").innerHTML = visiblePayslips()
    .map((slip) => `<option value="${slip.employeeId}">${slip.employeeId} - ${slip.name}</option>`)
    .join("");
  renderMonthOptions();
}

function renderMonthOptions() {
  const employeeId = $("#viewEmployeeSelect").value;
  const months = visiblePayslips().filter((slip) => slip.employeeId === employeeId);
  $("#viewMonthSelect").innerHTML = months.map((slip) => `<option value="${slip.month}">${monthName(slip.month)}</option>`).join("");
}

function selectedSlip() {
  return state.payslips.find((slip) => slip.employeeId === $("#viewEmployeeSelect").value && slip.month === $("#viewMonthSelect").value);
}

function renderPayslip() {
  const slip = selectedSlip();
  if (!slip) {
    $("#payslipPreview").innerHTML = `<div class="empty-state">No payslip found for the selected employee and month.</div>`;
    return;
  }

  const earningsTotal = sum(slip.earnings);
  const deductionsTotal = sum(slip.deductions);
  const netPay = earningsTotal - deductionsTotal;
  const remainingLoan = slip.loans.length ? Number(slip.loans[slip.loans.length - 1][3] || 0) : 0;
  const maxRows = Math.max(slip.earnings.length, slip.deductions.length);
  const salaryRows = Array.from({ length: maxRows }, (_, index) => {
    const earning = slip.earnings[index] || ["", ""];
    const deduction = slip.deductions[index] || ["", ""];
    return `<tr>
      <td>${earning[0]}</td><td class="amount green">${earning[0] ? money(earning[1]) : ""}</td>
      <td>${deduction[0]}</td><td class="amount red">${deduction[0] ? money(deduction[1]) : ""}</td>
    </tr>`;
  }).join("");

  $("#payslipPreview").innerHTML = `
    <div class="slip-inner">
      <header class="slip-header">
        <span class="copy-chip">▣ Copy 1/2</span>
        <h1>${company.name}</h1>
        <p class="company-line">⌖ ${company.address}</p>
        <p class="month-line">▣ Pay Slip : ${monthName(slip.month)}</p>
      </header>

      <section class="info-grid">
        ${infoItem("Employee ID", slip.employeeId)}
        ${infoItem("Name", slip.name || "-")}
        ${infoItem("Iqama Number", slip.iqama)}
        ${infoItem("Passport", slip.passport)}
        ${infoItem("Join Date", slip.joinDate)}
        ${infoItem("Nationality", slip.nationality)}
        ${infoItem("Vehicle Type", slip.vehicleType)}
        ${infoItem("VDA", findAmount(slip.earnings, "VDA"))}
        ${infoItem("Category", findAmount(slip.earnings, "Category"))}
      </section>

      <table class="salary-table">
        <thead><tr><th>Earnings</th><th class="amount">Amount (SAR)</th><th>Deductions</th><th class="amount">Amount (SAR)</th></tr></thead>
        <tbody>${salaryRows}<tr class="total-row"><td>Total Earnings</td><td class="amount green">${money(earningsTotal)}</td><td>Total Deductions</td><td class="amount red">${money(deductionsTotal)}</td></tr></tbody>
      </table>

      <section class="net-payment">NET PAYMENT <strong>${money(netPay)} SAR</strong></section>

      <section class="summary-grid">
        <div class="net-card">NET WAGES <strong>${money(netPay)} SAR</strong></div>
        <div class="bank-card"><span>Bank Details</span><strong>${slip.bankName}</strong><span>A/C Number</span><strong>${slip.accountNumber}</strong></div>
      </section>

      <section class="loan-section">
        <h3>▣ Active Loan Details</h3>
        <table class="loan-table">
          <thead><tr><th>#SL</th><th>Date</th><th>Details</th><th class="amount">Amount</th><th class="amount">Total Pay</th><th>(+/-)</th><th>Remarks</th></tr></thead>
          <tbody>${renderLoans(slip.loans)}</tbody>
        </table>
        <div class="loan-balance">Remaining Loan Balance: <span class="green">${money(remainingLoan)} SAR</span></div>
      </section>
      <p class="footer-note">Computer generated - No signature required</p>
    </div>`;
}

function infoItem(label, value) {
  return `<div class="info-item"><span>${label}</span><strong>${value || "-"}</strong></div>`;
}

function findAmount(rows, label) {
  const row = rows.find((item) => item[0].toLowerCase() === label.toLowerCase());
  return row ? money(row[1]) : "-";
}

function renderLoans(loans) {
  if (!loans.length) return `<tr><td colspan="7" class="empty-state">No active loan details.</td></tr>`;
  return loans.map((loan, index) => `<tr>
    <td>${index + 1}</td><td>${loan[0]}</td><td>${loan[1]}</td>
    <td class="amount ${loan[4] === "+" ? "green" : "red"}">${money(loan[2])}</td>
    <td class="amount ${Number(loan[3]) > 0 ? "red" : "green"}">${money(loan[3])}</td>
    <td class="${loan[4] === "+" ? "green" : "red"}">(${loan[4]})</td><td>${loan[5]}</td>
  </tr>`).join("");
}

function addAmountRow(container, label = "", amount = "") {
  const row = $("#amountRowTemplate").content.firstElementChild.cloneNode(true);
  row.querySelector(".row-label").value = label;
  row.querySelector(".row-amount").value = amount;
  row.querySelector(".remove-row").addEventListener("click", () => row.remove());
  $(container).appendChild(row);
}

function addLoanRow(loan = ["", "", "", "", "-", ""]) {
  const row = $("#loanRowTemplate").content.firstElementChild.cloneNode(true);
  row.querySelector(".loan-date").value = loan[0];
  row.querySelector(".loan-details").value = loan[1];
  row.querySelector(".loan-amount").value = loan[2];
  row.querySelector(".loan-total").value = loan[3];
  row.querySelector(".loan-sign").value = loan[4];
  row.querySelector(".loan-remarks").value = loan[5];
  row.querySelector(".remove-row").addEventListener("click", () => row.remove());
  $("#loanRows").appendChild(row);
}

function loadForm(slip = selectedSlip()) {
  if (!slip) return;
  $("#employeeSelect").value = slip.employeeId;
  $("#slipMonth").value = slip.month;
  $("#employeeName").value = slip.name;
  $("#iqama").value = slip.iqama;
  $("#passport").value = slip.passport;
  $("#nationality").value = slip.nationality;
  $("#joinDate").value = slip.joinDate;
  $("#vehicleType").value = slip.vehicleType;
  $("#bankName").value = slip.bankName;
  $("#accountNumber").value = slip.accountNumber;
  $("#earningsRows").innerHTML = "";
  $("#deductionRows").innerHTML = "";
  $("#loanRows").innerHTML = "";
  slip.earnings.forEach((row) => addAmountRow("#earningsRows", row[0], row[1]));
  slip.deductions.forEach((row) => addAmountRow("#deductionRows", row[0], row[1]));
  slip.loans.forEach(addLoanRow);
}

function rowsFrom(container) {
  return [...document.querySelectorAll(`${container} .row-line`)]
    .map((row) => [row.querySelector(".row-label").value, Number(row.querySelector(".row-amount").value || 0)])
    .filter((row) => row[0]);
}

function loanRowsFromForm() {
  return [...document.querySelectorAll("#loanRows .loan-line")]
    .map((row) => [
      row.querySelector(".loan-date").value,
      row.querySelector(".loan-details").value,
      Number(row.querySelector(".loan-amount").value || 0),
      Number(row.querySelector(".loan-total").value || 0),
      row.querySelector(".loan-sign").value,
      row.querySelector(".loan-remarks").value
    ])
    .filter((row) => row[0] || row[1]);
}

$("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const userId = $("#loginUser").value.trim();
  const password = $("#loginPassword").value;
  const fixedUser = users.find((item) => item.id.toLowerCase() === userId.toLowerCase() && item.password === password);
  const employeeSlip = state.payslips.find((slip) => slip.employeeId.toLowerCase() === userId.toLowerCase());
  const user = fixedUser || (password === "emp123" && employeeSlip
    ? { id: employeeSlip.employeeId, password, role: "employee", name: employeeSlip.name }
    : null);
  if (!user) {
    $("#loginError").textContent = "Invalid user ID or password.";
    return;
  }
  state.currentUser = user;
  $("#loginScreen").classList.add("hidden");
  $("#dashboard").classList.remove("hidden");
  $("#welcomeTitle").textContent = `Welcome, ${user.name}`;
  $("#adminPanel").classList.toggle("hidden", user.role !== "admin");
  document.querySelectorAll(".admin-only").forEach((item) => item.classList.toggle("hidden", user.role !== "admin"));
  renderSelectors();
  loadForm();
  renderPayslip();
});

$("#logoutBtn").addEventListener("click", () => location.reload());
$("#viewEmployeeSelect").addEventListener("change", () => { renderMonthOptions(); renderPayslip(); });
$("#viewMonthSelect").addEventListener("change", renderPayslip);
$("#editCurrentBtn").addEventListener("click", () => loadForm());
$("#printBtn").addEventListener("click", () => window.print());
$("#addEarningBtn").addEventListener("click", () => addAmountRow("#earningsRows"));
$("#addDeductionBtn").addEventListener("click", () => addAmountRow("#deductionRows"));
$("#addLoanBtn").addEventListener("click", () => addLoanRow());

$("#newSlipBtn").addEventListener("click", () => {
  $("#payslipForm").reset();
  $("#slipMonth").value = new Date().toISOString().slice(0, 7);
  $("#earningsRows").innerHTML = "";
  $("#deductionRows").innerHTML = "";
  $("#loanRows").innerHTML = "";
  addAmountRow("#earningsRows", "Category", 0);
  addAmountRow("#deductionRows", "Wallet", 0);
});

$("#employeeSelect").addEventListener("change", () => {
  const slip = state.payslips.find((item) => item.employeeId === $("#employeeSelect").value) || selectedSlip();
  if (slip) loadForm({ ...slip, month: $("#slipMonth").value || slip.month });
});

$("#payslipForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const employeeId = $("#employeeSelect").value.trim().toUpperCase() || `EMP${String(state.payslips.length + 1).padStart(3, "0")}`;
  const slip = {
    employeeId,
    month: $("#slipMonth").value,
    name: $("#employeeName").value,
    iqama: $("#iqama").value,
    passport: $("#passport").value,
    nationality: $("#nationality").value,
    joinDate: $("#joinDate").value,
    vehicleType: $("#vehicleType").value,
    bankName: $("#bankName").value,
    accountNumber: $("#accountNumber").value,
    earnings: rowsFrom("#earningsRows"),
    deductions: rowsFrom("#deductionRows"),
    loans: loanRowsFromForm()
  };
  const existingIndex = state.payslips.findIndex((item) => item.employeeId === employeeId && item.month === slip.month);
  if (existingIndex >= 0) state.payslips[existingIndex] = slip;
  else state.payslips.push(slip);
  saveState();
  renderSelectors();
  $("#viewEmployeeSelect").value = employeeId;
  renderMonthOptions();
  $("#viewMonthSelect").value = slip.month;
  renderPayslip();
});
