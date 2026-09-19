/* =========================================================
   STUDYFLOW
   Tasks + Timetable + Pomodoro + Progress
   Subjects + Files + Settings + AI Chat UI
========================================================= */


/* =========================================================
   SAFE LOCAL STORAGE
========================================================= */

function loadArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));

        return Array.isArray(value) ? value : [];
    } catch (error) {
        return [];
    }
}


function saveJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error("Could not save:", key, error);
    }
}


/* =========================================================
   GLOBAL DATA
========================================================= */

let tasks = loadArray("studyTasks");

let schedules = loadArray("studySchedules");

if (
    schedules.length === 0 &&
    localStorage.getItem("studyTimetable")
) {
    schedules = loadArray("studyTimetable");
}


let studyMinutes =
    Number(localStorage.getItem("studyMinutes")) || 0;


let todaySessions =
    Number(localStorage.getItem("todaySessions")) || 0;


/*
    IMPORTANT:
    Default study duration = 1 minute
    as requested for testing.
*/

let studyDuration =
    Number(localStorage.getItem("studyDuration")) || 1;


let breakDuration =
    Number(localStorage.getItem("breakDuration")) || 5;


let timerInterval = null;

let timerSeconds = studyDuration * 60;

let isStudyMode = true;


/* =========================================================
   SUBJECT FILE DATABASE
========================================================= */

const DB_NAME = "StudyFlowDatabase";
const DB_VERSION = 1;
const STORE_NAME = "studyFiles";

let studyDatabase = null;
let currentSubject = null;


/* =========================================================
   PAGE START
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    displayDate();

    displayTasks();

    displaySchedules();

    updateProgress();

    updateStudyTime();

    updateSubjectProgress();

    updateProgressDashboard();

    updateTodaySessions();

    loadPomodoroSettings();

    updateTimerDisplay();

    loadSavedTheme();

    loadSavedSettings();

    openStudyDatabase();

    updateAllFileCounts();

    initializeChat();

});


/* =========================================================
   DATE
========================================================= */

function displayDate() {

    const dateElement = document.getElementById("date");

    if (!dateElement) {
        return;
    }

    const today = new Date();

    dateElement.textContent =
        today.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
}


/* =========================================================
   TASK MANAGER
========================================================= */

function addTask() {

    const taskInput =
        document.getElementById("taskInput");

    const subjectInput =
        document.getElementById("subjectInput");

    const priorityInput =
        document.getElementById("priorityInput");

    const dateInput =
        document.getElementById("dateInput");

    const timeInput =
        document.getElementById("timeInput");


    if (!taskInput || !subjectInput) {
        alert("Task form could not be found.");
        return;
    }


    const name =
        taskInput.value.trim();

    const subject =
        subjectInput.value.trim();

    const priority =
        priorityInput
            ? priorityInput.value
            : "Medium";

    const date =
        dateInput
            ? dateInput.value
            : "";

    const time =
        timeInput
            ? timeInput.value
            : "";


    if (!name) {
        alert("Please enter a task.");
        taskInput.focus();
        return;
    }


    if (!subject) {
        alert("Please enter a subject.");
        subjectInput.focus();
        return;
    }


    const newTask = {

        id: Date.now(),

        name: name,

        subject: subject,

        priority: priority || "Medium",

        date: date,

        time: time,

        completed: false

    };


    tasks.push(newTask);

    saveJSON("studyTasks", tasks);


    taskInput.value = "";

    subjectInput.value = "";

    if (priorityInput) {
        priorityInput.value = "Medium";
    }

    if (dateInput) {
        dateInput.value = "";
    }

    if (timeInput) {
        timeInput.value = "";
    }


    displayTasks();

    updateProgress();

    updateSubjectProgress();

    updateProgressDashboard();


    alert("✅ Task added successfully!");
}


function displayTasks() {

    const list =
        document.getElementById("taskList");

    const count =
        document.getElementById("taskCount");


    if (!list) {
        return;
    }


    if (count) {
        count.textContent = tasks.length;
    }


    if (tasks.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                <span>📋</span>
                <p>No tasks yet. Add your first task!</p>
            </div>
        `;

        return;
    }


    const sortedTasks =
        [...tasks].sort(function (a, b) {

            if (a.completed !== b.completed) {
                return Number(a.completed) -
                    Number(b.completed);
            }

            if (a.date && b.date) {
                return a.date.localeCompare(b.date);
            }

            return b.id - a.id;

        });


    list.innerHTML =
        sortedTasks.map(function (task) {

            const priority =
                task.priority || "Medium";


            const dateText =
                task.date
                    ? formatDate(task.date)
                    : "";


            const timeText =
                task.time
                    ? formatTime(task.time)
                    : "";


            return `

                <div class="task-card ${task.completed ? "completed" : ""}">

                    <div class="task-main">

                        <div class="task-name">
                            ${escapeHTML(task.name)}
                        </div>

                        <div class="task-meta">

                            <span>
                                📚 ${escapeHTML(task.subject)}
                            </span>

                            <span class="priority-${priority.toLowerCase()}">
                                ${escapeHTML(priority)}
                            </span>

                            ${
                                dateText
                                ? `<span>📅 ${dateText}</span>`
                                : ""
                            }

                            ${
                                timeText
                                ? `<span>⏰ ${timeText}</span>`
                                : ""
                            }

                        </div>

                    </div>


                    <div class="task-actions">

                        <button
                            type="button"
                            onclick="completeTask(${task.id})"
                        >
                            ${task.completed ? "↩ Undo" : "✓ Done"}
                        </button>

                        <button
                            type="button"
                            class="delete-button"
                            onclick="deleteTask(${task.id})"
                        >
                            🗑 Delete
                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


function completeTask(id) {

    const task =
        tasks.find(function (item) {
            return item.id === id;
        });


    if (!task) {
        return;
    }


    task.completed =
        !task.completed;


    saveJSON("studyTasks", tasks);

    displayTasks();

    updateProgress();

    updateSubjectProgress();

    updateProgressDashboard();
}


function deleteTask(id) {

    const confirmed =
        confirm("Delete this task?");


    if (!confirmed) {
        return;
    }


    tasks =
        tasks.filter(function (task) {
            return task.id !== id;
        });


    saveJSON("studyTasks", tasks);

    displayTasks();

    updateProgress();

    updateSubjectProgress();

    updateProgressDashboard();
}


/* =========================================================
   TIMETABLE
========================================================= */

function addSchedule() {

    const dayInput =
        document.getElementById("dayInput");

    const subjectInput =
        document.getElementById("timetableSubject");

    const startInput =
        document.getElementById("startTime");

    const endInput =
        document.getElementById("endTime");


    if (!dayInput ||
        !subjectInput ||
        !startInput ||
        !endInput) {

        alert("Timetable form could not be found.");
        return;
    }


    const day =
        dayInput.value;

    const subject =
        subjectInput.value.trim();

    const startTime =
        startInput.value;

    const endTime =
        endInput.value;


    if (!day) {
        alert("Please select a day.");
        return;
    }


    if (!subject) {
        alert("Please enter a subject.");
        subjectInput.focus();
        return;
    }


    if (!startTime || !endTime) {
        alert("Please select start and end time.");
        return;
    }


    if (startTime >= endTime) {
        alert("End time must be after start time.");
        return;
    }


    const schedule = {

        id: Date.now(),

        day: day,

        subject: subject,

        startTime: startTime,

        endTime: endTime

    };


    schedules.push(schedule);


    saveJSON(
        "studySchedules",
        schedules
    );


    saveJSON(
        "studyTimetable",
        schedules
    );


    dayInput.value = "";

    subjectInput.value = "";

    startInput.value = "";

    endInput.value = "";


    displaySchedules();

    updateTodaySessions();


    alert("✅ Study session added!");
}


function displaySchedules() {

    const list =
        document.getElementById("timetableList");


    if (!list) {
        return;
    }


    if (schedules.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                <span>📅</span>
                <p>No timetable sessions yet.</p>
            </div>
        `;

        return;
    }


    const dayOrder = {

        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
        Sunday: 7

    };


    const sortedSchedules =
        [...schedules].sort(function (a, b) {

            const dayA =
                dayOrder[a.day] || 99;

            const dayB =
                dayOrder[b.day] || 99;


            if (dayA !== dayB) {
                return dayA - dayB;
            }


            const startA =
                a.startTime || a.start || "";

            const startB =
                b.startTime || b.start || "";


            return startA.localeCompare(startB);

        });


    list.innerHTML =
        sortedSchedules.map(function (schedule) {

            const start =
                schedule.startTime ||
                schedule.start ||
                "";

            const end =
                schedule.endTime ||
                schedule.end ||
                "";


            return `

                <div class="schedule-card">

                    <div class="schedule-left">

                        <div class="schedule-day">
                            ${escapeHTML(schedule.day)}
                        </div>

                        <div>

                            <div class="schedule-subject">
                                📚 ${escapeHTML(schedule.subject)}
                            </div>

                            <div class="schedule-time">
                                ⏰ ${formatTime(start)}
                                –
                                ${formatTime(end)}
                            </div>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="schedule-delete"
                        onclick="deleteSchedule(${schedule.id})"
                        title="Delete session"
                    >
                        🗑
                    </button>

                </div>

            `;

        }).join("");
}


function deleteSchedule(id) {

    if (!confirm("Delete this study session?")) {
        return;
    }


    schedules =
        schedules.filter(function (item) {
            return item.id !== id;
        });


    saveJSON(
        "studySchedules",
        schedules
    );


    saveJSON(
        "studyTimetable",
        schedules
    );


    displaySchedules();

    updateTodaySessions();
}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    const total =
        tasks.length;


    const completed =
        tasks.filter(function (task) {
            return task.completed;
        }).length;


    const totalElement =
        document.getElementById("totalTasks");

    const completedElement =
        document.getElementById("completedTasks");


    if (totalElement) {
        totalElement.textContent = total;
    }


    if (completedElement) {
        completedElement.textContent = completed;
    }


    const progress =
        total === 0
            ? 0
            : Math.round((completed / total) * 100);


    const progressElement =
        document.getElementById("progressPercentage");


    const progressFill =
        document.getElementById("progressBarFill");


    if (progressElement) {
        progressElement.textContent = progress;
    }


    if (progressFill) {
        progressFill.style.width =
            progress + "%";
    }
}


function updateStudyTime() {

    const element =
        document.getElementById("todayStudyTime");


    if (element) {
        element.textContent =
            studyMinutes;
    }
}


function updateProgressDashboard() {

    const completed =
        tasks.filter(function (task) {
            return task.completed;
        }).length;


    const total =
        tasks.length;


    const tasksElement =
        document.getElementById("progressTasks");


    const studyElement =
        document.getElementById("progressStudyTime");


    const percentageElement =
        document.getElementById("progressPercentage");


    const progressFill =
        document.getElementById("progressBarFill");


    if (tasksElement) {
        tasksElement.textContent =
            `${completed} / ${total}`;
    }


    if (studyElement) {
        studyElement.textContent =
            studyMinutes;
    }


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );


    if (percentageElement) {
        percentageElement.textContent =
            percentage;
    }


    if (progressFill) {
        progressFill.style.width =
            percentage + "%";
    }
}


function updateSubjectProgress() {

    const container =
        document.getElementById("subjectProgress");


    if (!container) {
        return;
    }


    const subjects = [
        "Physics",
        "Chemistry",
        "Mathematics",
        "Computer Science",
        "English"
    ];


    container.innerHTML =
        subjects.map(function (subject) {

            const subjectTasks =
                tasks.filter(function (task) {

                    return task.subject
                        .toLowerCase()
                        .trim() ===
                        subject.toLowerCase();

                });


            const total =
                subjectTasks.length;


            const completed =
                subjectTasks.filter(function (task) {
                    return task.completed;
                }).length;


            const percentage =
                total === 0
                    ? 0
                    : Math.round(
                        (completed / total) * 100
                    );


            return `

                <div class="subject-progress-row">

                    <div class="subject-progress-header">

                        <span>
                            ${escapeHTML(subject)}
                        </span>

                        <span>
                            ${percentage}%
                        </span>

                    </div>


                    <div class="subject-progress-bar">

                        <div
                            class="subject-progress-fill"
                            style="width:${percentage}%"
                        ></div>

                    </div>

                </div>

            `;

        }).join("");
}


function updateTodaySessions() {

    const element =
        document.getElementById("todaySessions");


    if (element) {
        element.textContent =
            todaySessions;
    }
}


/* =========================================================
   POMODORO
========================================================= */

function getStudyDuration() {

    const select =
        document.getElementById("studyDuration");


    if (!select) {
        return studyDuration;
    }


    if (select.value === "custom") {

        const custom =
            Number(
                document.getElementById(
                    "customStudyTime"
                )?.value
            );


        return custom > 0
            ? custom
            : studyDuration;
    }


    return Number(select.value);
}


function getBreakDuration() {

    const select =
        document.getElementById("breakDuration");


    if (!select) {
        return breakDuration;
    }


    if (select.value === "custom") {

        const custom =
            Number(
                document.getElementById(
                    "customBreakTime"
                )?.value
            );


        return custom > 0
            ? custom
            : breakDuration;
    }


    return Number(select.value);
}


function changeStudyDuration() {

    const select =
        document.getElementById("studyDuration");

    const customInput =
        document.getElementById("customStudyTime");


    if (!select) {
        return;
    }


    if (select.value === "custom") {

        if (customInput) {
            customInput.style.display = "block";
            customInput.focus();
        }

    } else {

        if (customInput) {
            customInput.style.display = "none";
        }


        studyDuration =
            Number(select.value);


        localStorage.setItem(
            "studyDuration",
            studyDuration
        );


        if (isStudyMode) {
            resetTimer();
        }

    }
}


function changeBreakDuration() {

    const select =
        document.getElementById("breakDuration");

    const customInput =
        document.getElementById("customBreakTime");


    if (!select) {
        return;
    }


    if (select.value === "custom") {

        if (customInput) {
            customInput.style.display = "block";
            customInput.focus();
        }

    } else {

        if (customInput) {
            customInput.style.display = "none";
        }


        breakDuration =
            Number(select.value);


        localStorage.setItem(
            "breakDuration",
            breakDuration
        );


        if (!isStudyMode) {
            resetTimer();
        }

    }
}


function setStudyMode() {

    isStudyMode = true;

    studyDuration =
        getStudyDuration();


    timerSeconds =
        studyDuration * 60;


    clearInterval(timerInterval);

    timerInterval = null;


    const studyButton =
        document.getElementById(
            "studyModeButton"
        );


    const breakButton =
        document.getElementById(
            "breakModeButton"
        );


    const mode =
        document.getElementById(
            "timerMode"
        );


    if (studyButton) {
        studyButton.classList.add("active");
    }


    if (breakButton) {
        breakButton.classList.remove("active");
    }


    if (mode) {
        mode.textContent =
            "📚 Study Time";
    }


    updateTimerDisplay();
}


function setBreakMode() {

    isStudyMode = false;

    breakDuration =
        getBreakDuration();


    timerSeconds =
        breakDuration * 60;


    clearInterval(timerInterval);

    timerInterval = null;


    const studyButton =
        document.getElementById(
            "studyModeButton"
        );


    const breakButton =
        document.getElementById(
            "breakModeButton"
        );


    const mode =
        document.getElementById(
            "timerMode"
        );


    if (studyButton) {
        studyButton.classList.remove("active");
    }


    if (breakButton) {
        breakButton.classList.add("active");
    }


    if (mode) {
        mode.textContent =
            "☕ Break Time";
    }


    updateTimerDisplay();
}


function startTimer() {

    if (timerInterval !== null) {
        return;
    }


    if (timerSeconds <= 0) {

        if (isStudyMode) {
            timerSeconds =
                getStudyDuration() * 60;
        } else {
            timerSeconds =
                getBreakDuration() * 60;
        }

    }


    timerInterval =
        setInterval(function () {

            timerSeconds--;

            updateTimerDisplay();


            if (timerSeconds <= 0) {

                clearInterval(timerInterval);

                timerInterval = null;

                finishTimerSession();

            }

        }, 1000);
}


function pauseTimer() {

    clearInterval(timerInterval);

    timerInterval = null;
}


function resetTimer() {

    clearInterval(timerInterval);

    timerInterval = null;


    if (isStudyMode) {

        studyDuration =
            getStudyDuration();


        timerSeconds =
            studyDuration * 60;

    } else {

        breakDuration =
            getBreakDuration();


        timerSeconds =
            breakDuration * 60;

    }


    updateTimerDisplay();
}


function finishTimerSession() {

    if (isStudyMode) {

        studyMinutes +=
            studyDuration;


        todaySessions++;


        localStorage.setItem(
            "studyMinutes",
            studyMinutes
        );


        localStorage.setItem(
            "todaySessions",
            todaySessions
        );


        updateStudyTime();

        updateProgressDashboard();

        updateTodaySessions();


        sendStudyNotification(
            "Study session complete! 🎉",
            "Time for your break."
        );


        alert(
            "🎉 Study session complete! Time for a " +
            breakDuration +
            "-minute break."
        );


        setBreakMode();

    } else {

        sendStudyNotification(
            "Break finished! ☕",
            "Ready for another study session?"
        );


        alert(
            "☕ Break finished! Ready for another study session?"
        );


        setStudyMode();

    }
}


function updateTimerDisplay() {

    const timer =
        document.getElementById("timer");


    if (!timer) {
        return;
    }


    const minutes =
        Math.floor(timerSeconds / 60);


    const seconds =
        timerSeconds % 60;


    timer.textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");


    updateTimerProgress();
}


function updateTimerProgress() {

    const fill =
        document.getElementById(
            "timerProgressFill"
        );


    if (!fill) {
        return;
    }


    const totalSeconds =
        (
            isStudyMode
                ? getStudyDuration()
                : getBreakDuration()
        ) * 60;


    const percentage =
        totalSeconds <= 0
            ? 0
            : Math.max(
                0,
                Math.min(
                    100,
                    (timerSeconds /
                        totalSeconds) * 100
                )
            );


    fill.style.width =
        percentage + "%";
}


function loadPomodoroSettings() {

    const studySelect =
        document.getElementById(
            "studyDuration"
        );


    const breakSelect =
        document.getElementById(
            "breakDuration"
        );


    if (studySelect) {

        const allowedStudy =
            ["1", "25", "45", "60"];


        if (
            allowedStudy.includes(
                String(studyDuration)
            )
        ) {

            studySelect.value =
                String(studyDuration);

        } else {

            studySelect.value =
                "custom";


            const custom =
                document.getElementById(
                    "customStudyTime"
                );


            if (custom) {
                custom.style.display =
                    "block";

                custom.value =
                    studyDuration;
            }
        }
    }


    if (breakSelect) {

        const allowedBreak =
            ["5", "10", "15"];


        if (
            allowedBreak.includes(
                String(breakDuration)
            )
        ) {

            breakSelect.value =
                String(breakDuration);

        } else {

            breakSelect.value =
                "custom";


            const custom =
                document.getElementById(
                    "customBreakTime"
                );


            if (custom) {
                custom.style.display =
                    "block";

                custom.value =
                    breakDuration;
            }
        }
    }
}


/* =========================================================
   SUBJECT FILES - INDEXEDDB
========================================================= */

function openStudyDatabase() {

    if (!window.indexedDB) {
        console.warn(
            "IndexedDB is not supported."
        );
        return;
    }


    const request =
        indexedDB.open(
            DB_NAME,
            DB_VERSION
        );


    request.onupgradeneeded =
        function (event) {

            const db =
                event.target.result;


            if (
                !db.objectStoreNames.contains(
                    STORE_NAME
                )
            ) {

                const store =
                    db.createObjectStore(
                        STORE_NAME,
                        {
                            keyPath: "id",
                            autoIncrement: true
                        }
                    );


                store.createIndex(
                    "subject",
                    "subject",
                    { unique: false }
                );
            }
        };


    request.onsuccess =
        function (event) {

            studyDatabase =
                event.target.result;


            updateAllFileCounts();

            if (currentSubject) {
                displaySubjectFiles();
            }

        };


    request.onerror =
        function (event) {

            console.error(
                "Database error:",
                event.target.error
            );

        };
}


function uploadStudyFile() {

    const input =
        document.getElementById(
            "studyFileInput"
        );


    if (input) {
        input.click();
    }
}


function handleFileUpload(event) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    if (!currentSubject) {

        alert(
            "Please open a subject first."
        );

        return;
    }


    saveStudyFile(
        file,
        currentSubject
    );


    event.target.value = "";
}


function saveStudyFile(file, subject) {

    if (!studyDatabase) {

        alert(
            "Study file storage is still loading. Please try again."
        );

        return;
    }


    const transaction =
        studyDatabase.transaction(
            STORE_NAME,
            "readwrite"
        );


    const store =
        transaction.objectStore(
            STORE_NAME
        );


    const request =
        store.add({

            subject: subject,

            name: file.name,

            type: file.type,

            size: file.size,

            data: file,

            createdAt: new Date().toISOString()

        });


    request.onsuccess =
        function () {

            displaySubjectFiles();

            updateAllFileCounts();

            alert(
                "📚 Study file uploaded successfully!"
            );

        };


    request.onerror =
        function () {

            alert(
                "Could not save this file."
            );

        };
}


function getSubjectFiles(subject) {

    return new Promise(function (
        resolve,
        reject
    ) {

        if (!studyDatabase) {
            resolve([]);
            return;
        }


        const transaction =
            studyDatabase.transaction(
                STORE_NAME,
                "readonly"
            );


        const store =
            transaction.objectStore(
                STORE_NAME
            );


        const index =
            store.index("subject");


        const request =
            index.getAll(subject);


        request.onsuccess =
            function () {
                resolve(
                    request.result || []
                );
            };


        request.onerror =
            function () {
                reject(
                    request.error
                );
            };

    });
}


async function openSubject(subject) {

    currentSubject =
        subject;


    const modal =
        document.getElementById(
            "subjectModal"
        );


    const name =
        document.getElementById(
            "modalSubjectName"
        );


    const icon =
        document.getElementById(
            "modalSubjectIcon"
        );


    const icons = {

        Physics: "⚡",

        Chemistry: "🧪",

        Mathematics: "📐",

        "Computer Science": "💻",

        English: "📖"

    };


    if (name) {
        name.textContent =
            subject;
    }


    if (icon) {
        icon.textContent =
            icons[subject] || "📚";
    }


    if (modal) {
        modal.classList.add("show");
    }


    await displaySubjectFiles();
}


function closeSubject() {

    const modal =
        document.getElementById(
            "subjectModal"
        );


    if (modal) {
        modal.classList.remove("show");
    }


    currentSubject = null;
}


async function displaySubjectFiles() {

    const container =
        document.getElementById(
            "subjectFiles"
        );


    if (!container || !currentSubject) {
        return;
    }


    const files =
        await getSubjectFiles(
            currentSubject
        );


    const count =
        document.getElementById(
            "modalFileCount"
        );


    if (count) {

        count.textContent =
            files.length +
            (files.length === 1
                ? " file"
                : " files");

    }


    if (files.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <span>📂</span>
                <p>No files uploaded yet.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        files.map(function (file) {

            return `

                <div
                    class="file-card"
                    data-file-name="${escapeHTML(file.name.toLowerCase())}"
                >

                    <div class="file-info">

                        <div class="file-name">
                            ${getFileIcon(file.type)}
                            ${escapeHTML(file.name)}
                        </div>

                        <div class="file-size">
                            ${formatFileSize(file.size)}
                        </div>

                    </div>


                    <div class="file-actions">

                        <button
                            type="button"
                            onclick="openStudyFile(${file.id})"
                        >
                            Open
                        </button>

                        <button
                            type="button"
                            onclick="downloadStudyFile(${file.id})"
                        >
                            Save
                        </button>

                        <button
                            type="button"
                            class="remove-file"
                            onclick="removeStudyFile(${file.id})"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


function searchStudyFiles() {

    const searchInput =
        document.getElementById(
            "studyFileSearch"
        );


    const search =
        (searchInput?.value || "")
            .toLowerCase()
            .trim();


    const cards =
        document.querySelectorAll(
            ".file-card"
        );


    cards.forEach(function (card) {

        const name =
            card.dataset.fileName || "";


        card.style.display =
            name.includes(search)
                ? "flex"
                : "none";

    });
}


function openStudyFile(id) {

    if (!studyDatabase) {
        return;
    }


    const transaction =
        studyDatabase.transaction(
            STORE_NAME,
            "readonly"
        );


    const store =
        transaction.objectStore(
            STORE_NAME
        );


    const request =
        store.get(id);


    request.onsuccess =
        function () {

            const file =
                request.result;


            if (!file || !file.data) {
                return;
            }


            const url =
                URL.createObjectURL(
                    file.data
                );


            window.open(
                url,
                "_blank"
            );


            setTimeout(function () {

                URL.revokeObjectURL(url);

            }, 60000);

        };
}


function downloadStudyFile(id) {

    if (!studyDatabase) {
        return;
    }


    const transaction =
        studyDatabase.transaction(
            STORE_NAME,
            "readonly"
        );


    const store =
        transaction.objectStore(
            STORE_NAME
        );


    const request =
        store.get(id);


    request.onsuccess =
        function () {

            const file =
                request.result;


            if (!file || !file.data) {
                return;
            }


            const url =
                URL.createObjectURL(
                    file.data
                );


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                file.name;


            document.body.appendChild(link);

            link.click();

            link.remove();


            setTimeout(function () {

                URL.revokeObjectURL(url);

            }, 1000);

        };
}


function removeStudyFile(id) {

    if (!confirm("Delete this study file?")) {
        return;
    }


    if (!studyDatabase) {
        return;
    }


    const transaction =
        studyDatabase.transaction(
            STORE_NAME,
            "readwrite"
        );


    const store =
        transaction.objectStore(
            STORE_NAME
        );


    store.delete(id);


    transaction.oncomplete =
        function () {

            displaySubjectFiles();

            updateAllFileCounts();

        };
}


function updateAllFileCounts() {

    const subjects = [
        "Physics",
        "Chemistry",
        "Mathematics",
        "Computer Science",
        "English"
    ];


    subjects.forEach(async function (subject) {

        const files =
            await getSubjectFiles(
                subject
            );


        const element =
            document.getElementById(
                "count-" + subject
            );


        if (element) {

            element.textContent =
                files.length +
                (files.length === 1
                    ? " file"
                    : " files");

        }

    });
}


function clearStudyFiles() {

    return new Promise(function (
        resolve
    ) {

        if (!studyDatabase) {
            resolve();
            return;
        }


        const transaction =
            studyDatabase.transaction(
                STORE_NAME,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                STORE_NAME
            );


        store.clear();


        transaction.oncomplete =
            function () {
                resolve();
            };


        transaction.onerror =
            function () {
                resolve();
            };

    });
}


/* =========================================================
   SETTINGS
========================================================= */

function toggleDarkMode() {

    const toggle =
        document.getElementById(
            "darkModeToggle"
        );


    const isDark =
        toggle
            ? toggle.checked
            : true;


    document.body.classList.toggle(
        "light-mode",
        !isDark
    );


    localStorage.setItem(
        "darkMode",
        isDark
            ? "true"
            : "false"
    );


    showSettingsMessage(
        isDark
            ? "🌙 Dark Mode enabled."
            : "☀️ Light Mode enabled."
    );
}


function loadSavedTheme() {

    const saved =
        localStorage.getItem(
            "darkMode"
        );


    const toggle =
        document.getElementById(
            "darkModeToggle"
        );


    if (saved === "false") {

        document.body.classList.add(
            "light-mode"
        );


        if (toggle) {
            toggle.checked = false;
        }

    } else {

        document.body.classList.remove(
            "light-mode"
        );


        if (toggle) {
            toggle.checked = true;
        }
    }
}


function toggleNotifications() {

    const toggle =
        document.getElementById(
            "notificationToggle"
        );


    const enabled =
        toggle
            ? toggle.checked
            : false;


    localStorage.setItem(
        "notifications",
        enabled
            ? "true"
            : "false"
    );


    if (
        enabled &&
        "Notification" in window &&
        Notification.permission !== "granted"
    ) {

        Notification.requestPermission()
            .then(function (permission) {

                if (permission !== "granted") {

                    if (toggle) {
                        toggle.checked = false;
                    }


                    localStorage.setItem(
                        "notifications",
                        "false"
                    );


                    showSettingsMessage(
                        "🔔 Notification permission was not granted."
                    );

                } else {

                    showSettingsMessage(
                        "🔔 Notifications enabled."
                    );

                }

            });

    } else {

        showSettingsMessage(
            enabled
                ? "🔔 Notifications enabled."
                : "🔕 Notifications disabled."
        );
    }
}


function loadSavedSettings() {

    const saved =
        localStorage.getItem(
            "notifications"
        );


    const toggle =
        document.getElementById(
            "notificationToggle"
        );


    if (toggle) {

        toggle.checked =
            saved === "true";

    }
}


function sendStudyNotification(
    title,
    message
) {

    const enabled =
        localStorage.getItem(
            "notifications"
        ) === "true";


    if (
        enabled &&
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        new Notification(
            title,
            {
                body: message,
                icon: "icon-192.png"
            }
        );

    }
}


async function resetStudyFlow() {

    const confirmed =
        confirm(
            "Are you sure you want to reset all StudyFlow data?"
        );


    if (!confirmed) {
        return;
    }


    localStorage.clear();


    try {
        await clearStudyFiles();
    } catch (error) {
        console.warn(
            "Could not clear study files:",
            error
        );
    }


    alert(
        "🗑️ StudyFlow data has been reset."
    );


    location.reload();
}


function showSettingsMessage(message) {

    const element =
        document.getElementById(
            "settingsMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    setTimeout(function () {

        element.textContent = "";

    }, 3000);
}


/* =========================================================
   AI CHAT UI
========================================================= */

function initializeChat() {

    const input =
        document.getElementById(
            "chatInput"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "keydown",
        handleChatKey
    );
}


function handleChatKey(event) {

    if (event.key === "Enter") {

        event.preventDefault();

        sendAIMessage();

    }
}


function sendAIMessage() {

    const input =
        document.getElementById(
            "chatInput"
        );


    const container =
        document.getElementById(
            "chatMessages"
        );


    if (!input || !container) {
        return;
    }


    const message =
        input.value.trim();


    if (!message) {
        return;
    }


    const userMessage =
        document.createElement("div");


    userMessage.className =
        "chat-message user-message";


    userMessage.innerHTML = `
        <strong>You</strong>
        <p>${escapeHTML(message)}</p>
    `;


    container.appendChild(
        userMessage
    );


    input.value = "";


    const assistantMessage =
        document.createElement("div");


    assistantMessage.className =
        "chat-message assistant-message";


    assistantMessage.innerHTML = `
        <strong>StudyFlow AI</strong>
        <p>
            AI Chat is ready in the StudyFlow interface,
            but a secure AI backend still needs to be connected
            before I can generate live AI answers.
        </p>
    `;


    container.appendChild(
        assistantMessage
    );


    container.scrollTop =
        container.scrollHeight;
}


/* =========================================================
   SUPABASE HUMAN CHAT SUPPORT
   Kept for compatibility with your existing project.
========================================================= */

let activeChatUser = null;


async function getChatCurrentUser() {

    if (!supabaseClient) {
        return null;
    }


    try {

        const result =
            await supabaseClient.auth.getUser();


        return result.data?.user || null;

    } catch (error) {

        console.warn(
            "Supabase user unavailable:",
            error
        );


        return null;
    }
}


async function openChat(
    userId,
    username
) {

    activeChatUser = {

        id: userId,

        username: username

    };


    console.log(
        "Chat opened with:",
        username
    );


    if (
        typeof loadMessages ===
        "function"
    ) {

        await loadMessages();

    }
}


async function loadMessages() {

    if (
        !supabaseClient ||
        !activeChatUser
    ) {
        return [];
    }


    const currentUser =
        await getChatCurrentUser();


    if (!currentUser) {
        return [];
    }


    try {

        const result =
            await supabaseClient
                .from("messages")
                .select("*")
                .or(
                    `and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChatUser.id}),and(sender_id.eq.${activeChatUser.id},receiver_id.eq.${currentUser.id})`
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (result.error) {
            console.warn(
                result.error
            );

            return [];
        }


        return result.data || [];

    } catch (error) {

        console.warn(
            "Could not load messages:",
            error
        );

        return [];
    }
}


async function sendMessage(message) {

    if (
        !supabaseClient ||
        !activeChatUser
    ) {
        return;
    }


    const currentUser =
        await getChatCurrentUser();


    if (!currentUser) {
        alert(
            "Please sign in before using user chat."
        );

        return;
    }


    const text =
        String(message || "").trim();


    if (!text) {
        return;
    }


    try {

        const result =
            await supabaseClient
                .from("messages")
                .insert({

                    sender_id:
                        currentUser.id,

                    receiver_id:
                        activeChatUser.id,

                    message:
                        text

                });


        if (result.error) {

            console.error(
                result.error
            );

        }

    } catch (error) {

        console.error(
            "Could not send message:",
            error
        );

    }
}


/* =========================================================
   UTILITIES
========================================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }


    try {

        return new Date(
            dateString + "T00:00:00"
        ).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

    } catch (error) {

        return dateString;

    }
}


function formatTime(time) {

    if (!time) {
        return "";
    }


    const parts =
        time.split(":");


    let hour =
        Number(parts[0]);


    const minute =
        parts[1] || "00";


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 || 12;


    return (
        hour +
        ":" +
        minute +
        " " +
        suffix
    );
}


function formatFileSize(bytes) {

    if (!bytes) {
        return "0 Bytes";
    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        parseFloat(
            (
                bytes /
                Math.pow(1024, index)
            ).toFixed(2)
        ) +
        " " +
        units[index]
    );
}


function getFileIcon(type) {

    if (!type) {
        return "📄";
    }


    if (type.includes("pdf")) {
        return "📕";
    }


    if (type.includes("image")) {
        return "🖼️";
    }


    if (
        type.includes("word") ||
        type.includes("document")
    ) {
        return "📘";
    }


    if (
        type.includes("sheet") ||
        type.includes("excel")
    ) {
        return "📗";
    }


    if (
        type.includes("presentation") ||
        type.includes("powerpoint")
    ) {
        return "📙";
    }


    return "📄";
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const modal =
            document.getElementById(
                "subjectModal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeSubject();

        }

    }
);


/* =========================================================
   MAKE INLINE HTML BUTTONS WORK
   This is important for onclick="..."
========================================================= */

window.addTask =
    addTask;

window.completeTask =
    completeTask;

window.deleteTask =
    deleteTask;

window.addSchedule =
    addSchedule;

window.deleteSchedule =
    deleteSchedule;

window.startTimer =
    startTimer;

window.pauseTimer =
    pauseTimer;

window.resetTimer =
    resetTimer;

window.setStudyMode =
    setStudyMode;

window.setBreakMode =
    setBreakMode;

window.changeStudyDuration =
    changeStudyDuration;

window.changeBreakDuration =
    changeBreakDuration;

window.openSubject =
    openSubject;

window.closeSubject =
    closeSubject;

window.uploadStudyFile =
    uploadStudyFile;

window.handleFileUpload =
    handleFileUpload;

window.openStudyFile =
    openStudyFile;

window.downloadStudyFile =
    downloadStudyFile;

window.removeStudyFile =
    removeStudyFile;

window.searchStudyFiles =
    searchStudyFiles;

window.toggleDarkMode =
    toggleDarkMode;

window.toggleNotifications =
    toggleNotifications;

window.resetStudyFlow =
    resetStudyFlow;

window.sendStudyNotification =
    sendStudyNotification;

window.sendAIMessage =
    sendAIMessage;

window.handleChatKey =
    handleChatKey;

window.openChat =
    openChat;

window.loadMessages =
    loadMessages;

window.sendMessage =
    sendMessage;


/* =========================================================
   SERVICE WORKER
========================================================= */

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        function () {

            navigator.serviceWorker
                .register("service-worker.js")
                .catch(function (error) {

                    console.log(
                        "Service worker not available yet."
                    );

                });

        }
    );
}
