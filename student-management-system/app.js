/* StudentFlow — interactive student management dashboard.
   Demo records are stored in localStorage, so changes persist in this browser. */
"use strict";

const STORAGE_KEY = "studentflow_students_v1";
const SUBJECTS = ["Mathematics", "Science", "English", "History"];
const SUBJECT_COLORS = ["fill-teal", "fill-pink", "fill-blue", "fill-lime"];
const AVATAR_COLORS = [
  "avatar-bg-0",
  "avatar-bg-1",
  "avatar-bg-2",
  "avatar-bg-3",
];

const initialStudents = [
  {
    id: "STU-201",
    name: "Olivia Bennett",
    className: "Grade 10",
    email: "olivia.b@example.com",
    attendance: 98,
    previous: 91,
    grades: { Mathematics: 96, Science: 94, English: 92, History: 95 },
  },
  {
    id: "STU-202",
    name: "Ethan Carter",
    className: "Grade 11",
    email: "ethan.c@example.com",
    attendance: 96,
    previous: 84,
    grades: { Mathematics: 89, Science: 91, English: 86, History: 88 },
  },
  {
    id: "STU-203",
    name: "Sophia Mitchell",
    className: "Grade 9",
    email: "sophia.m@example.com",
    attendance: 99,
    previous: 90,
    grades: { Mathematics: 94, Science: 96, English: 91, History: 93 },
  },
  {
    id: "STU-204",
    name: "Noah Williams",
    className: "Grade 12",
    email: "noah.w@example.com",
    attendance: 88,
    previous: 74,
    grades: { Mathematics: 76, Science: 72, English: 81, History: 77 },
  },
  {
    id: "STU-205",
    name: "Ava Thompson",
    className: "Grade 10",
    email: "ava.t@example.com",
    attendance: 97,
    previous: 79,
    grades: { Mathematics: 87, Science: 90, English: 92, History: 88 },
  },
  {
    id: "STU-206",
    name: "Liam Anderson",
    className: "Grade 8",
    email: "liam.a@example.com",
    attendance: 91,
    previous: 66,
    grades: { Mathematics: 65, Science: 72, English: 68, History: 64 },
  },
  {
    id: "STU-207",
    name: "Isabella Martinez",
    className: "Grade 11",
    email: "isabella.m@example.com",
    attendance: 100,
    previous: 88,
    grades: { Mathematics: 91, Science: 88, English: 95, History: 92 },
  },
  {
    id: "STU-208",
    name: "Mason Lee",
    className: "Grade 9",
    email: "mason.l@example.com",
    attendance: 93,
    previous: 75,
    grades: { Mathematics: 79, Science: 82, English: 75, History: 80 },
  },
  {
    id: "STU-209",
    name: "Mia Robinson",
    className: "Grade 12",
    email: "mia.r@example.com",
    attendance: 95,
    previous: 82,
    grades: { Mathematics: 86, Science: 84, English: 89, History: 87 },
  },
  {
    id: "STU-210",
    name: "James Wilson",
    className: "Grade 8",
    email: "james.w@example.com",
    attendance: 81,
    previous: 61,
    grades: { Mathematics: 59, Science: 66, English: 63, History: 68 },
  },
  {
    id: "STU-211",
    name: "Amelia Davis",
    className: "Grade 10",
    email: "amelia.d@example.com",
    attendance: 98,
    previous: 86,
    grades: { Mathematics: 92, Science: 89, English: 94, History: 90 },
  },
  {
    id: "STU-212",
    name: "Lucas Garcia",
    className: "Grade 11",
    email: "lucas.g@example.com",
    attendance: 90,
    previous: 70,
    grades: { Mathematics: 73, Science: 77, English: 71, History: 75 },
  },
];

let students = loadStudents();
let currentPage = 1;
const pageSize = 6;
let performanceChart = null;
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);
const average = (student) => {
  const grades = Object.values(student.grades || {});
  return grades.length
    ? Math.round(
        grades.reduce((sum, grade) => sum + Number(grade || 0), 0) /
          grades.length,
      )
    : 0;
};
const initials = (name) =>
  String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const safeNumber = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Number(value) || 0));

function loadStudents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn(
      "Could not load saved student records. Demo records will be used.",
      error,
    );
  }
  return structuredClone(initialStudents);
}
function persistStudents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch (error) {
    showToast("Could not save changes in this browser.");
    console.error("Student records could not be saved:", error);
  }
}
function getStatus(score) {
  if (score >= 90) return { label: "Excellent", className: "status-excellent" };
  if (score >= 80) return { label: "Good", className: "status-good" };
  if (score >= 70) return { label: "Average", className: "status-average" };
  return { label: "Support", className: "status-support" };
}
function getFilteredStudents() {
  const query = $("#studentSearch").value.trim().toLowerCase();
  const filter = $("#gradeFilter").value;
  return students.filter((student) => {
    const score = average(student);
    const matchesQuery = [
      student.name,
      student.id,
      student.className,
      student.email,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(query),
    );
    const matchesFilter =
      filter === "all" ||
      (filter === "excellent" && score >= 90) ||
      (filter === "good" && score >= 80 && score < 90) ||
      (filter === "average" && score >= 70 && score < 80) ||
      (filter === "support" && score < 70);
    return matchesQuery && matchesFilter;
  });
}
function renderDashboard() {
  renderStats();
  renderStudents();
  renderLeaders();
  renderSubjects();
  renderAttendance();
  renderChart();
}
function renderStats() {
  const total = students.length;
  const averageGrade = total
    ? Math.round(
        students.reduce((sum, student) => sum + average(student), 0) / total,
      )
    : 0;
  const attendance = total
    ? Math.round(
        students.reduce(
          (sum, student) => sum + safeNumber(student.attendance),
          0,
        ) / total,
      )
    : 0;
  $("#totalStudents").textContent = total;
  $("#averageGrade").textContent = averageGrade;
  $("#attendanceRate").textContent = attendance;
  $("#needsSupport").textContent = students.filter(
    (student) => average(student) < 70,
  ).length;
  $("#navStudentCount").textContent = total;
  $("#studentHeadingCount").textContent = total;
}
function renderStudents() {
  const filtered = getFilteredStudents();
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageStudents = filtered.slice(start, start + pageSize);
  $("#studentTableBody").innerHTML = pageStudents
    .map((student) => {
      const score = average(student);
      const status = getStatus(score);
      const globalIndex = students.findIndex((item) => item.id === student.id);
      const avatarColor =
        AVATAR_COLORS[
          (globalIndex < 0 ? 0 : globalIndex) % AVATAR_COLORS.length
        ];
      const progress = Math.round(score - safeNumber(student.previous, 0, 100));
      const progressColor = progress >= 0 ? "fill-teal" : "fill-pink";
      const progressText = `${progress > 0 ? "+" : ""}${progress}%`;
      return `<tr>
      <td><div class="student-cell"><span class="student-avatar ${avatarColor}">${escapeHTML(initials(student.name))}</span><span><strong>${escapeHTML(student.name)}</strong><small>${escapeHTML(student.email || "No email added")}</small></span></div></td>
      <td>${escapeHTML(student.id)}</td><td>${escapeHTML(student.className)}</td>
      <td><span class="grade-value">${score}<small>%</small></span></td>
      <td><div class="mini-progress"><div class="progress-track"><div class="progress-fill ${progressColor}" style="width:${Math.min(100, Math.abs(progress) * 4 + 20)}%"></div></div><span>${progressText}</span></div></td>
      <td><span class="status-pill ${status.className}">${status.label}</span></td>
      <td><div class="row-action"><button data-action="details" data-id="${escapeHTML(student.id)}" aria-label="View ${escapeHTML(student.name)} details" title="View details"><i class="bi bi-eye"></i></button><button data-action="edit" data-id="${escapeHTML(student.id)}" aria-label="Edit ${escapeHTML(student.name)}" title="Edit student"><i class="bi bi-pencil"></i></button></div></td>
    </tr>`;
    })
    .join("");
  $("#emptyState").classList.toggle("hidden", filtered.length !== 0);
  $("#studentTableBody")
    .closest(".table-scroll")
    .querySelector(".student-table")
    .classList.toggle("hidden", filtered.length === 0);
  $("#tableSummary").textContent = filtered.length
    ? `Showing ${start + 1}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length} students`
    : "Showing 0 students";
  $("#pageLabel").textContent = `${currentPage} / ${totalPages}`;
  $("#prevPage").disabled = currentPage <= 1;
  $("#nextPage").disabled = currentPage >= totalPages;
}
function renderLeaders() {
  const leaders = [...students]
    .sort((a, b) => average(b) - average(a))
    .slice(0, 4);
  $("#leaderList").innerHTML = leaders.length
    ? leaders
        .map((student, index) => {
          const color =
            AVATAR_COLORS[
              students.findIndex((item) => item.id === student.id) %
                AVATAR_COLORS.length
            ];
          const score = average(student);
          const delta = score - safeNumber(student.previous);
          return `<div class="leader-row"><span class="rank-number">${String(index + 1).padStart(2, "0")}</span><span class="student-avatar ${color}">${escapeHTML(initials(student.name))}</span><div class="leader-info"><strong>${escapeHTML(student.name)}</strong><small>${escapeHTML(student.className)}</small></div><div class="leader-grade"><strong>${score}%</strong><small>${delta >= 0 ? "+" : ""}${delta}% ${delta >= 0 ? "growth" : "change"}</small></div></div>`;
        })
        .join("")
    : '<p class="panel-subtitle">Add students to see the class leaders.</p>';
  if (leaders.length) {
    $("#leaderList").insertAdjacentHTML(
      "beforeend",
      `<div class="leader-footer"><i class="bi bi-stars"></i> ${leaders.filter((student) => average(student) >= 90).length} students currently scoring 90% or higher</div>`,
    );
  }
}
function renderSubjects() {
  const subjectScores = SUBJECTS.map((subject) => ({
    name: subject,
    score: students.length
      ? Math.round(
          students.reduce(
            (sum, student) => sum + Number(student.grades?.[subject] || 0),
            0,
          ) / students.length,
        )
      : 0,
  }));
  $("#subjectList").innerHTML = subjectScores
    .map(
      (subject, index) =>
        `<div class="subject-row"><div class="subject-row-top"><span>${subject.name}</span><strong>${subject.score}%</strong></div><div class="progress-track"><div class="progress-fill ${SUBJECT_COLORS[index]}" style="width:${subject.score}%"></div></div></div>`,
    )
    .join("");
  const strongest = [...subjectScores].sort((a, b) => b.score - a.score)[0];
  $("#strongestSubject").textContent = strongest
    ? strongest.name
    : "No data yet";
}
function renderAttendance() {
  const total = students.length;
  const present = students.filter(
    (student) => safeNumber(student.attendance) >= 90,
  ).length;
  const late = students.filter(
    (student) =>
      safeNumber(student.attendance) >= 75 &&
      safeNumber(student.attendance) < 90,
  ).length;
  const absent = total - present - late;
  $("#presentCount").textContent = present;
  $("#lateCount").textContent = late;
  $("#absentCount").textContent = absent;
  $("#presentBar").style.width = `${total ? (present / total) * 100 : 0}%`;
  $("#lateBar").style.width = `${total ? (late / total) * 100 : 0}%`;
  $("#absentBar").style.width = `${total ? (absent / total) * 100 : 0}%`;
}
function renderChart() {
  if (!window.Chart) return;
  const context = $("#performanceChart").getContext("2d");
  const isYear = $("#chartPeriod").value === "year";
  const labels = isYear
    ? [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ]
    : [
        "Week 1",
        "Week 2",
        "Week 3",
        "Week 4",
        "Week 5",
        "Week 6",
        "Week 7",
        "Week 8",
      ];
  const currentAverage = students.length
    ? students.reduce((sum, student) => sum + average(student), 0) /
      students.length
    : 0;
  const data = isYear
    ? labels.map((_, index) =>
        Math.max(
          0,
          Math.min(
            100,
            Math.round(
              currentAverage - 7 + index * 1.1 + Math.sin(index * 1.2) * 3,
            ),
          ),
        ),
      )
    : labels.map((_, index) =>
        Math.max(
          0,
          Math.min(
            100,
            Math.round(
              currentAverage - 5 + index * 0.9 + Math.sin(index * 1.4) * 2,
            ),
          ),
        ),
      );
  if (performanceChart) performanceChart.destroy();
  performanceChart = new Chart(context, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Average score",
          data,
          borderColor: "#19b8a6",
          backgroundColor: "rgba(25,184,166,.10)",
          fill: true,
          tension: 0.38,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#19b8a6",
        },
        {
          label: "Target score",
          data: labels.map(() => 85),
          borderColor: "#e84393",
          borderDash: [5, 5],
          borderWidth: 1.7,
          pointRadius: 0,
          fill: false,
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#172b35",
          padding: 10,
          displayColors: true,
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${context.parsed.y}%`,
          },
        },
      },
      scales: {
        y: {
          min: 40,
          max: 100,
          ticks: {
            stepSize: 20,
            color: "#9aa5ac",
            font: { size: 9 },
            callback: (value) => `${value}%`,
          },
          grid: { color: "#edf0f2", drawBorder: false },
          border: { display: false },
        },
        x: {
          ticks: { color: "#9aa5ac", font: { size: 9 }, maxRotation: 0 },
          grid: { display: false },
          border: { display: false },
        },
      },
    },
  });
}
function openStudentModal(student = null) {
  $("#studentForm").reset();
  $("#formError").classList.add("hidden");
  $("#editingStudentId").value = student?.id || "";
  $("#modalTitle").textContent = student ? "Edit student" : "Add a student";
  $("#saveButtonText").textContent = student ? "Save changes" : "Save student";
  $("#studentId").disabled = Boolean(student);
  $("#studentName").value = student?.name || "";
  $("#studentId").value = student?.id || "";
  $("#studentClass").value = student?.className || "";
  $("#studentEmail").value = student?.email || "";
  $("#studentAttendance").value = student?.attendance ?? 95;
  $("#studentPrevious").value = student?.previous ?? 75;
  $("#gradeMath").value = student?.grades?.Mathematics ?? 80;
  $("#gradeScience").value = student?.grades?.Science ?? 80;
  $("#gradeEnglish").value = student?.grades?.English ?? 80;
  $("#gradeHistory").value = student?.grades?.History ?? 80;
  $("#studentModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#studentName").focus(), 30);
}
function closeModal(modalId) {
  $(modalId).classList.add("hidden");
  if (
    $("#studentModal").classList.contains("hidden") &&
    $("#detailsModal").classList.contains("hidden")
  )
    document.body.style.overflow = "";
}
function saveStudent(event) {
  event.preventDefault();
  const editingId = $("#editingStudentId").value;
  const id = $("#studentId").value.trim().toUpperCase();
  const name = $("#studentName").value.trim();
  const existing = students.some(
    (student) =>
      student.id.toLowerCase() === id.toLowerCase() && student.id !== editingId,
  );
  const error = $("#formError");
  if (!name || !id || !$("#studentClass").value) {
    error.textContent = "Please complete the required fields.";
    error.classList.remove("hidden");
    return;
  }
  if (existing) {
    error.textContent =
      "That student ID is already in use. Please choose a unique ID.";
    error.classList.remove("hidden");
    $("#studentId").focus();
    return;
  }
  const student = {
    id: editingId || id,
    name,
    className: $("#studentClass").value,
    email: $("#studentEmail").value.trim(),
    attendance: safeNumber($("#studentAttendance").value),
    previous: safeNumber($("#studentPrevious").value),
    grades: {
      Mathematics: safeNumber($("#gradeMath").value),
      Science: safeNumber($("#gradeScience").value),
      English: safeNumber($("#gradeEnglish").value),
      History: safeNumber($("#gradeHistory").value),
    },
  };
  if (editingId) {
    students = students.map((item) => (item.id === editingId ? student : item));
    showToast("Student record updated.");
  } else {
    students.unshift(student);
    currentPage = 1;
    showToast("Student added successfully.");
  }
  persistStudents();
  closeModal("#studentModal");
  renderDashboard();
}
function openDetails(studentId) {
  const student = students.find((item) => item.id === studentId);
  if (!student) return;
  const score = average(student);
  const status = getStatus(score);
  const progress = score - safeNumber(student.previous);
  const color = AVATAR_COLORS[students.indexOf(student) % AVATAR_COLORS.length];
  $("#detailsTitle").textContent = "Student details";
  $("#studentDetailsContent").innerHTML = `
    <div class="detail-hero"><span class="student-avatar ${color}">${escapeHTML(initials(student.name))}</span><div><h3>${escapeHTML(student.name)}</h3><p>${escapeHTML(student.id)} · ${escapeHTML(student.className)}</p><p>${escapeHTML(student.email || "No email address added")}</p></div><div class="detail-grade"><strong>${score}%</strong><small>${status.label}</small></div></div>
    <div class="detail-stats"><div class="detail-stat"><span>Attendance</span><strong>${safeNumber(student.attendance)}%</strong></div><div class="detail-stat"><span>Previous average</span><strong>${safeNumber(student.previous)}%</strong></div><div class="detail-stat"><span>Progress</span><strong style="color:${progress >= 0 ? "#087f78" : "#e84393"}">${progress > 0 ? "+" : ""}${progress}%</strong></div></div>
    <h3 class="details-subhead">Subject grades</h3>
    ${SUBJECTS.map((subject, index) => `<div class="detail-subject"><span>${subject}</span><div class="progress-track"><div class="progress-fill ${SUBJECT_COLORS[index]}" style="width:${safeNumber(student.grades?.[subject])}%"></div></div><strong>${safeNumber(student.grades?.[subject])}%</strong></div>`).join("")}
    <div class="detail-notes"><strong>Progress note:</strong> ${progress >= 5 ? "Great improvement! Keep building on these positive learning habits." : progress >= 0 ? "Performance is steady. Regular practice can help maintain progress." : "Consider a supportive check-in and a focused learning plan for this student."}</div>
    <div class="modal-actions"><button class="outline-button" data-detail-action="edit" data-id="${escapeHTML(student.id)}"><i class="bi bi-pencil"></i> Edit record</button><button class="primary-button" data-detail-action="close">Done</button></div>`;
  $("#detailsModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function showToast(message) {
  $("#toastMessage").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2800);
}
function exportCSV() {
  const headers = [
    "Student ID",
    "Name",
    "Class",
    "Email",
    "Average Grade",
    "Attendance",
    "Previous Average",
    ...SUBJECTS,
  ];
  const rows = students.map((student) => [
    student.id,
    student.name,
    student.className,
    student.email || "",
    average(student),
    safeNumber(student.attendance),
    safeNumber(student.previous),
    ...SUBJECTS.map((subject) => safeNumber(student.grades?.[subject])),
  ]);
  const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "studentflow-records.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Student records exported to CSV.");
}
function updateDate() {
  $("#todayLabel").textContent = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}
function bindEvents() {
  $("#addStudentButton").addEventListener("click", () => openStudentModal());
  $("#closeModal").addEventListener("click", () => closeModal("#studentModal"));
  $("#cancelModal").addEventListener("click", () =>
    closeModal("#studentModal"),
  );
  $("#closeDetails").addEventListener("click", () =>
    closeModal("#detailsModal"),
  );
  $("#studentForm").addEventListener("submit", saveStudent);
  $("#studentSearch").addEventListener("input", () => {
    currentPage = 1;
    renderStudents();
  });
  $("#gradeFilter").addEventListener("change", () => {
    currentPage = 1;
    renderStudents();
  });
  $("#prevPage").addEventListener("click", () => {
    currentPage = Math.max(1, currentPage - 1);
    renderStudents();
  });
  $("#nextPage").addEventListener("click", () => {
    currentPage += 1;
    renderStudents();
  });
  $("#chartPeriod").addEventListener("change", renderChart);
  $("#exportButton").addEventListener("click", exportCSV);
  $("#viewAllLeaders").addEventListener("click", () => {
    $("#studentSearch").value = "";
    $("#gradeFilter").value = "all";
    currentPage = 1;
    renderStudents();
    $("#students").scrollIntoView({ behavior: "smooth" });
  });
  $("#studentTableBody").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const student = students.find((item) => item.id === button.dataset.id);
    if (!student) return;
    if (button.dataset.action === "details") openDetails(student.id);
    if (button.dataset.action === "edit") openStudentModal(student);
  });
  $("#studentDetailsContent").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-detail-action]");
    if (!button) return;
    if (button.dataset.detailAction === "close") closeModal("#detailsModal");
    if (button.dataset.detailAction === "edit") {
      const student = students.find((item) => item.id === button.dataset.id);
      closeModal("#detailsModal");
      if (student) openStudentModal(student);
    }
  });
  $("#studentModal").addEventListener("click", (event) => {
    if (event.target === $("#studentModal")) closeModal("#studentModal");
  });
  $("#detailsModal").addEventListener("click", (event) => {
    if (event.target === $("#detailsModal")) closeModal("#detailsModal");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal("#studentModal");
      closeModal("#detailsModal");
      $("#sidebar").classList.remove("sidebar-open");
    }
  });
  $("#menuToggle").addEventListener("click", () =>
    $("#sidebar").classList.toggle("sidebar-open"),
  );
  document.querySelectorAll(".nav-link").forEach((link) =>
    link.addEventListener("click", () => {
      document
        .querySelectorAll(".nav-link")
        .forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
      $("#sidebar").classList.remove("sidebar-open");
    }),
  );
  $("#subjectInfo").addEventListener("click", () =>
    showToast(
      "Subject averages are calculated from each student's recorded grades.",
    ),
  );
  $("#notificationButton").addEventListener("click", () =>
    showToast("You're all caught up. No new notifications."),
  );
}
document.addEventListener("DOMContentLoaded", () => {
  updateDate();
  bindEvents();
  renderDashboard();
});
