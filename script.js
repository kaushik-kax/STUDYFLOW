/* =========================================
   STUDYFLOW
   COMPLETE JAVASCRIPT
========================================= */


/* =========================================
   TASK DATA
========================================= */

let tasks =
    JSON.parse(localStorage.getItem("studyTasks")) || [];

let schedules =
    JSON.parse(localStorage.getItem("studySchedules")) || [];


/* =========================================
   STUDY PROGRESS
========================================= */

let studyMinutes =
    Number(localStorage.getItem("studyMinutes")) || 0;

let todaySessions =
    Number(localStorage.getItem("todaySessions")) || 0;


/* =========================================
   POMODORO VARIABLES
========================================= */

let studyDuration =
    Number(localStorage.getItem("studyDuration")) || 25;

let breakDuration =
    Number(localStorage.getItem("breakDuration")) || 5;

let timerInterval = null;

let timerSeconds =
    studyDuration * 60;

let isStudyMode = true;


/* =========================================
   INDEXED DB
========================================= */

const DB_NAME = "StudyFlowDatabase";

const DB_VERSION = 1;

const STORE_NAME = "studyFiles";

let studyDatabase = null;

let currentSubject = null;


/* =========================================
   DATE
========================================= */

function displayDate() {

    let dateElement =
        document.getElementById("date");

    if (!dateElement) {
        return;
    }

    let today = new Date();

    dateElement.textContent =
        today.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );
}


/* =========================================
   TASK MANAGER
========================================= */

function addTask() {

    let taskInput =
        document.getElementById("taskInput");

    let subjectInput =
        document.getElementById("subjectInput");

    let priorityInput =
        document.getElementById("priorityInput");

    let dateInput =
        document.getElementById("dateInput");

    let timeInput =
        document.getElementById("timeInput");


    if (
        !taskInput ||
        !subjectInput ||
        !priorityInput ||
        !dateInput ||
        !timeInput
    ) {

        alert("Task form could not be found.");

        return;
    }


    let name =
        taskInput.value.trim();

    let subject =
        subjectInput.value;

    let priority =
        priorityInput.value;

    let date =
        dateInput.value;

    let time =
        timeInput.value;


    if (name === "") {

        alert("Please enter a task.");

        return;
    }


    if (subject === "") {

        alert("Please select a subject.");

        return;
    }


    if (priority === "") {

        priority = "Medium";

    }


    let task = {

        id: Date.now(),

        name: name,

        subject: subject,

        priority: priority,

        date: date,

        time: time,

        completed: false

    };


    tasks.push(task);


    localStorage.setItem(
        "studyTasks",
        JSON.stringify(tasks)
    );


    taskInput.value = "";

    subjectInput.value = "";

    priorityInput.value = "Medium";

    dateInput.value = "";

    timeInput.value = "";


    displayTasks();

    updateProgress();

    updateSubjectProgress();

}


/* =========================================
   DISPLAY TASKS
========================================= */

function displayTasks() {

    let container =
        document.getElementById("tasks");

    let count =
        document.getElementById("taskCount");


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (count) {

        count.textContent =
            tasks.length +
            (
                tasks.length === 1
                    ? " task"
                    : " tasks"
            );

    }


    tasks.forEach(function(task) {


        /* FIX OLD TASKS */

        if (!task.priority) {

            task.priority = "Medium";

        }


        if (typeof task.completed !== "boolean") {

            task.completed = false;

        }


        if (!task.subject) {

            task.subject = "General";

        }


        let card =
            document.createElement("div");


        card.className =
            "task-card";


        if (task.completed) {

            card.classList.add("completed");

        }


        let priorityClass =
            String(task.priority).toLowerCase();


        let dateText = "";


        if (task.date) {

            dateText =
                "📅 " +
                task.date;

        }


        if (task.time) {

            if (dateText !== "") {

                dateText +=
                    " • ";

            }


            dateText +=
                "⏰ " +
                task.time;

        }


        card.innerHTML =

            '<div class="task-check">' +

                (
                    task.completed
                        ? "✓"
                        : ""
                ) +

            '</div>' +


            '<div class="task-main">' +


                '<div class="premium-task-title">' +

                    escapeHTML(
                        task.name
                    ) +

                '</div>' +


                '<div class="task-meta">' +


                    '<span class="task-subject">' +

                        escapeHTML(
                            task.subject
                        ) +

                    '</span>' +


                    '<span class="task-priority ' +

                        priorityClass +

                    '">' +

                        getPriorityIcon(
                            task.priority
                        ) +

                        " " +

                        escapeHTML(
                            task.priority
                        ) +

                    '</span>' +


                '</div>' +


                (
                    dateText !== ""
                        ?

                        '<div class="task-date">' +

                            escapeHTML(
                                dateText
                            ) +

                        '</div>'

                        :

                        ""
                ) +


            '</div>' +


            '<div class="task-actions">' +


                '<button onclick="completeTask(' +

                    task.id +

                ')">' +

                    (
                        task.completed
                            ? "Undo"
                            : "Complete"
                    ) +

                '</button>' +


                '<button onclick="deleteTask(' +

                    task.id +

                ')">' +

                    "Delete" +

                '</button>' +


            '</div>';


        container.appendChild(card);

    });


    /* Save repaired old tasks */

    localStorage.setItem(
        "studyTasks",
        JSON.stringify(tasks)
    );

}


/* =========================================
   PRIORITY ICON
========================================= */

function getPriorityIcon(priority) {

    if (priority === "High") {

        return "🔥";

    }


    if (priority === "Low") {

        return "◇";

    }


    return "◆";

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(text) {

    let div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;

}


/* =========================================
   COMPLETE TASK
========================================= */

function completeTask(id) {

    tasks =
        tasks.map(function(task) {

            if (task.id === id) {

                task.completed =
                    !task.completed;

            }


            return task;

        });


    localStorage.setItem(
        "studyTasks",
        JSON.stringify(tasks)
    );


    displayTasks();

    updateProgress();

    updateSubjectProgress();

}


/* =========================================
   DELETE TASK
========================================= */

function deleteTask(id) {

    let confirmed =
        confirm(
            "Delete this task?"
        );


    if (!confirmed) {

        return;

    }


    tasks =
        tasks.filter(function(task) {

            return task.id !== id;

        });


    localStorage.setItem(
        "studyTasks",
        JSON.stringify(tasks)
    );


    displayTasks();

    updateProgress();

    updateSubjectProgress();

}


/* =========================================
   PROGRESS
========================================= */

function updateProgress() {

    let total =
        tasks.length;


    let completed =
        tasks.filter(function(task) {

            return task.completed === true;

        }).length;


    let percentage = 0;


    if (total > 0) {

        percentage =
            Math.round(
                (completed / total) * 100
            );

    }


    let progressTasks =
        document.getElementById(
            "progressTasks"
        );


    let progressPercentage =
        document.getElementById(
            "progressPercentage"
        );


    let todayCompleted =
        document.getElementById(
            "todayCompleted"
        );


    if (progressTasks) {

        progressTasks.textContent =
            completed +
            " / " +
            total;

    }


    if (progressPercentage) {

        progressPercentage.textContent =
            percentage +
            "%";

    }


    if (todayCompleted) {

        todayCompleted.textContent =
            completed;

    }


    updateStudyTime();

}


/* =========================================
   STUDY TIME
========================================= */

function updateStudyTime() {

    let element =
        document.getElementById(
            "progressStudyTime"
        );


    let todayElement =
        document.getElementById(
            "todayStudyTime"
        );


    if (element) {

        element.textContent =
            studyMinutes +
            " min";

    }


    if (todayElement) {

        todayElement.textContent =
            studyMinutes +
            " min";

    }

}


/* =========================================
   SUBJECT PROGRESS
========================================= */

function updateSubjectProgress() {

    let subjects = [

        "Physics",

        "Chemistry",

        "Mathematics",

        "Computer Science",

        "English"

    ];


    let container =
        document.getElementById(
            "subjectProgress"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    subjects.forEach(function(subject) {


        let total =
            tasks.filter(function(task) {

                return task.subject === subject;

            }).length;


        let completed =
            tasks.filter(function(task) {

                return (
                    task.subject === subject &&
                    task.completed === true
                );

            }).length;


        let percentage = 0;


        if (total > 0) {

            percentage =
                Math.round(
                    (completed / total) * 100
                );

        }


        let item =
            document.createElement("div");


        item.className =
            "subject-progress-item";


        item.innerHTML =

            '<div class="subject-progress-top">' +

                '<span class="subject-progress-name">' +

                    escapeHTML(
                        subject
                    ) +

                '</span>' +


                '<span class="subject-progress-percent">' +

                    completed +

                    " / " +

                    total +

                    " • " +

                    percentage +

                    "%" +

                '</span>' +

            '</div>' +


            '<div class="subject-progress-bar">' +

                '<div class="subject-progress-fill" style="width:' +

                    percentage +

                    '%' +

                '"></div>' +

            '</div>';


        container.appendChild(item);

    });

}


/* =========================================
   TIMETABLE
========================================= */

function addSchedule() {

    let day =
        document.getElementById(
            "dayInput"
        ).value;


    let subject =
        document.getElementById(
            "timetableSubject"
        ).value;


    let startTime =
        document.getElementById(
            "startTime"
        ).value;


    let endTime =
        document.getElementById(
            "endTime"
        ).value;


    if (
        day === "" ||
        subject === "" ||
        startTime === "" ||
        endTime === ""
    ) {

        alert(
            "Please complete the timetable details."
        );

        return;

    }


    let schedule = {

        id: Date.now(),

        day: day,

        subject: subject,

        startTime: startTime,

        endTime: endTime

    };


    schedules.push(schedule);


    localStorage.setItem(
        "studySchedules",
        JSON.stringify(schedules)
    );


    document.getElementById(
        "dayInput"
    ).value = "";


    document.getElementById(
        "timetableSubject"
    ).value = "";


    document.getElementById(
        "startTime"
    ).value = "";


    document.getElementById(
        "endTime"
    ).value = "";


    displaySchedules();

    updateTodaySessions();

}


/* =========================================
   DISPLAY SCHEDULES
========================================= */

function displaySchedules() {

    let container =
        document.getElementById(
            "timetableList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    schedules.forEach(function(schedule) {


        let card =
            document.createElement("div");


        card.className =
            "schedule-card";


        card.innerHTML =

            '<div class="schedule-info">' +

                '<span class="schedule-day">' +

                    escapeHTML(
                        schedule.day
                    ) +

                '</span>' +


                '<span class="schedule-subject">' +

                    escapeHTML(
                        schedule.subject
                    ) +

                '</span>' +


                '<span class="schedule-time">' +

                    "⏰ " +

                    escapeHTML(
                        schedule.startTime
                    ) +

                    " – " +

                    escapeHTML(
                        schedule.endTime
                    ) +

                '</span>' +

            '</div>' +


            '<button onclick="deleteSchedule(' +

                schedule.id +

            ')">' +

                "Delete" +

            '</button>';


        container.appendChild(card);

    });

}


/* =========================================
   DELETE SCHEDULE
========================================= */

function deleteSchedule(id) {

    schedules =
        schedules.filter(function(schedule) {

            return schedule.id !== id;

        });


    localStorage.setItem(
        "studySchedules",
        JSON.stringify(schedules)
    );


    displaySchedules();

    updateTodaySessions();

}


/* =========================================
   TODAY'S SESSIONS
========================================= */

function updateTodaySessions() {

    let days = [

        "Sunday",

        "Monday",

        "Tuesday",

        "Wednesday",

        "Thursday",

        "Friday",

        "Saturday"

    ];


    let today =
        days[new Date().getDay()];


    let count =
        schedules.filter(function(schedule) {

            return schedule.day === today;

        }).length;


    let element =
        document.getElementById(
            "todaySessions"
        );


    if (element) {

        element.textContent =
            count;

    }

}


/* =========================================
   POMODORO
========================================= */

function getStudyDuration() {

    let select =
        document.getElementById(
            "studyDuration"
        );


    if (!select) {

        return 25;

    }


    if (select.value === "custom") {

        let customInput =
            document.getElementById(
                "customStudyTime"
            );


        let custom =
            Number(
                customInput.value
            );


        if (custom > 0) {

            return custom;

        }


        return studyDuration;

    }


    return Number(
        select.value
    );

}


function getBreakDuration() {

    let select =
        document.getElementById(
            "breakDuration"
        );


    if (!select) {

        return 5;

    }


    if (select.value === "custom") {

        let customInput =
            document.getElementById(
                "customBreakTime"
            );


        let custom =
            Number(
                customInput.value
            );


        if (custom > 0) {

            return custom;

        }


        return breakDuration;

    }


    return Number(
        select.value
    );

}


function changeStudyDuration() {

    let select =
        document.getElementById(
            "studyDuration"
        );


    let customInput =
        document.getElementById(
            "customStudyTime"
        );


    if (select.value === "custom") {

        customInput.style.display =
            "block";

        customInput.focus();

    } else {

        customInput.style.display =
            "none";


        studyDuration =
            Number(
                select.value
            );


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

    let select =
        document.getElementById(
            "breakDuration"
        );


    let customInput =
        document.getElementById(
            "customBreakTime"
        );


    if (select.value === "custom") {

        customInput.style.display =
            "block";

        customInput.focus();

    } else {

        customInput.style.display =
            "none";


        breakDuration =
            Number(
                select.value
            );


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

    pauseTimer();


    studyDuration =
        getStudyDuration();


    localStorage.setItem(
        "studyDuration",
        studyDuration
    );


    isStudyMode = true;


    timerSeconds =
        studyDuration * 60;


    let mode =
        document.getElementById(
            "timerMode"
        );


    if (mode) {

        mode.textContent =
            "Study Session";

    }


    let studyButton =
        document.getElementById(
            "studyModeButton"
        );


    let breakButton =
        document.getElementById(
            "breakModeButton"
        );


    if (studyButton) {

        studyButton.classList.add(
            "active"
        );

    }


    if (breakButton) {

        breakButton.classList.remove(
            "active"
        );

    }


    updateTimerDisplay();

    updateTimerProgress();

}


function setBreakMode() {

    pauseTimer();


    breakDuration =
        getBreakDuration();


    localStorage.setItem(
        "breakDuration",
        breakDuration
    );


    isStudyMode = false;


    timerSeconds =
        breakDuration * 60;


    let mode =
        document.getElementById(
            "timerMode"
        );


    if (mode) {

        mode.textContent =
            "Break Time";

    }


    let studyButton =
        document.getElementById(
            "studyModeButton"
        );


    let breakButton =
        document.getElementById(
            "breakModeButton"
        );


    if (studyButton) {

        studyButton.classList.remove(
            "active"
        );

    }


    if (breakButton) {

        breakButton.classList.add(
            "active"
        );

    }


    updateTimerDisplay();

    updateTimerProgress();

}


function startTimer() {

    if (timerInterval !== null) {

        return;

    }


    timerInterval =
        setInterval(function() {


            if (timerSeconds > 0) {

                timerSeconds--;

                updateTimerDisplay();

                updateTimerProgress();

            } else {


                clearInterval(
                    timerInterval
                );


                timerInterval =
                    null;


                if (isStudyMode) {


                    studyMinutes =
                        studyMinutes +
                        studyDuration;


                    localStorage.setItem(
                        "studyMinutes",
                        studyMinutes
                    );


                    updateStudyTime();


                    alert(
                        "🎉 Study session complete! Time for a break."
                    );


                    setBreakMode();


                } else {


                    alert(
                        "☕ Break complete! Ready to study?"
                    );


                    setStudyMode();

                }

            }


        }, 1000);

}


function pauseTimer() {

    if (timerInterval !== null) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;

    }

}


function resetTimer() {

    pauseTimer();


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

    updateTimerProgress();

}


function updateTimerDisplay() {

    let minutes =
        Math.floor(
            timerSeconds / 60
        );


    let seconds =
        timerSeconds % 60;


    let timer =
        document.getElementById(
            "timer"
        );


    if (!timer) {

        return;

    }


    timer.textContent =

        String(minutes).padStart(
            2,
            "0"
        ) +

        ":" +

        String(seconds).padStart(
            2,
            "0"
        );

}


function updateTimerProgress() {

    let progress =
        document.getElementById(
            "timerProgressFill"
        );


    if (!progress) {

        return;

    }


    let totalSeconds;


    if (isStudyMode) {

        totalSeconds =
            studyDuration * 60;

    } else {

        totalSeconds =
            breakDuration * 60;

    }


    let percentage =

        (timerSeconds / totalSeconds) *
        100;


    progress.style.width =

        Math.max(
            0,
            Math.min(
                100,
                percentage
            )
        ) +

        "%";

}


function loadPomodoroSettings() {

    let studySelect =
        document.getElementById(
            "studyDuration"
        );


    let breakSelect =
        document.getElementById(
            "breakDuration"
        );


    if (studySelect) {


        if (

            studyDuration === 25 ||

            studyDuration === 50 ||

            studyDuration === 60

        ) {

            studySelect.value =
                String(
                    studyDuration
                );

        } else {

            studySelect.value =
                "custom";


            let customStudy =
                document.getElementById(
                    "customStudyTime"
                );


            if (customStudy) {

                customStudy.style.display =
                    "block";


                customStudy.value =
                    studyDuration;

            }

        }

    }


    if (breakSelect) {


        if (

            breakDuration === 5 ||

            breakDuration === 10 ||

            breakDuration === 15

        ) {

            breakSelect.value =
                String(
                    breakDuration
                );

        } else {

            breakSelect.value =
                "custom";


            let customBreak =
                document.getElementById(
                    "customBreakTime"
                );


            if (customBreak) {

                customBreak.style.display =
                    "block";


                customBreak.value =
                    breakDuration;

            }

        }

    }

}


/* =========================================
   INDEXED DB — STUDY FILES
========================================= */

function openStudyDatabase() {

    return new Promise(function(
        resolve,
        reject
    ) {


        let request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );


        request.onupgradeneeded =
            function(event) {

                let db =
                    event.target.result;


                if (
                    !db.objectStoreNames.contains(
                        STORE_NAME
                    )
                ) {


                    let store =
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
                        {
                            unique: false
                        }
                    );

                }

            };


        request.onsuccess =
            function(event) {

                studyDatabase =
                    event.target.result;


                resolve(
                    studyDatabase
                );

            };


        request.onerror =
            function(event) {

                reject(
                    event.target.error
                );

            };

    });

}


function saveStudyFile(
    subject,
    file
) {

    return new Promise(function(
        resolve,
        reject
    ) {


        let transaction =
            studyDatabase.transaction(
                STORE_NAME,
                "readwrite"
            );


        let store =
            transaction.objectStore(
                STORE_NAME
            );


        let fileData = {

            subject: subject,

            name: file.name,

            type: file.type,

            size: file.size,

            file: file,

            addedAt:
                new Date().toISOString()

        };


        let request =
            store.add(
                fileData
            );


        request.onsuccess =
            function() {

                resolve();

            };


        request.onerror =
            function(event) {

                reject(
                    event.target.error
                );

            };

    });

}


function getSubjectFiles(subject) {

    return new Promise(function(
        resolve,
        reject
    ) {


        if (!studyDatabase) {

            resolve([]);

            return;

        }


        let transaction =
            studyDatabase.transaction(
                STORE_NAME,
                "readonly"
            );


        let store =
            transaction.objectStore(
                STORE_NAME
            );


        let index =
            store.index(
                "subject"
            );


        let request =
            index.getAll(
                subject
            );


        request.onsuccess =
            function() {

                resolve(
                    request.result
                );

            };


        request.onerror =
            function(event) {

                reject(
                    event.target.error
                );

            };

    });

}


function deleteStudyFile(id) {

    return new Promise(function(
        resolve,
        reject
    ) {


        let transaction =
            studyDatabase.transaction(
                STORE_NAME,
                "readwrite"
            );


        let store =
            transaction.objectStore(
                STORE_NAME
            );


        let request =
            store.delete(
                id
            );


        request.onsuccess =
            function() {

                resolve();

            };


        request.onerror =
            function(event) {

                reject(
                    event.target.error
                );

            };

    });

}


/* =========================================
   SUBJECT MODAL
========================================= */

function openSubject(subject) {

    currentSubject =
        subject;


    let modal =
        document.getElementById(
            "subjectModal"
        );


    let name =
        document.getElementById(
            "modalSubjectName"
        );


    let icon =
        document.getElementById(
            "modalSubjectIcon"
        );


    if (!modal || !name || !icon) {

        return;

    }


    name.textContent =
        subject;


    let icons = {

        "Physics": "⚡",

        "Chemistry": "⚗",

        "Mathematics": "∑",

        "Computer Science": "</>",

        "English": "✎"

    };


    icon.textContent =
        icons[subject] || "✦";


    modal.classList.add(
        "show"
    );


    let searchInput =
        document.getElementById(
            "studyFileSearch"
        );


    if (searchInput) {

        searchInput.value = "";

    }


    displaySubjectFiles();

}


function closeSubject() {

    let modal =
        document.getElementById(
            "subjectModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    currentSubject =
        null;

}


/* =========================================
   FILE UPLOAD
========================================= */

async function handleFileUpload(event) {

    let files =
        event.target.files;


    if (
        !files ||
        files.length === 0
    ) {

        return;

    }


    if (!currentSubject) {

        alert(
            "Please select a subject first."
        );

        return;

    }


    if (!studyDatabase) {

        alert(
            "Study storage is still loading. Please try again."
        );

        return;

    }


    try {


        for (
            let i = 0;
            i < files.length;
            i++
        ) {

            await saveStudyFile(
                currentSubject,
                files[i]
            );

        }


        event.target.value =
            "";


        await displaySubjectFiles();

        await updateAllFileCounts();


    } catch (error) {


        console.error(
            "File save error:",
            error
        );


        alert(
            "Could not save the study file."
        );

    }

}


/* =========================================
   DISPLAY SUBJECT FILES
========================================= */

async function displaySubjectFiles() {

    if (!currentSubject) {

        return;

    }


    let container =
        document.getElementById(
            "subjectFiles"
        );


    let count =
        document.getElementById(
            "modalFileCount"
        );


    if (!container) {

        return;

    }


    let files =
        await getSubjectFiles(
            currentSubject
        );


    container.innerHTML =
        "";


    if (count) {

        count.textContent =

            files.length +

            (
                files.length === 1
                    ? " file"
                    : " files"
            );

    }


    if (files.length === 0) {

        container.innerHTML =

            '<div class="no-files">' +

                "No study files added yet." +

            '</div>';

        return;

    }


    files.forEach(function(fileData) {


        let item =
            document.createElement(
                "div"
            );


        /* IMPORTANT:
           This class allows the search
           function to find each file.
        */

        item.className =
            "file-item study-file-item";


        item.innerHTML =

            '<div class="file-icon">' +

                getFileIcon(
                    fileData.name,
                    fileData.type
                ) +

            '</div>' +


            '<div class="file-details">' +

                '<div class="file-name">' +

                    escapeHTML(
                        fileData.name
                    ) +

                '</div>' +


                '<div class="file-size">' +

                    formatFileSize(
                        fileData.size
                    ) +

                '</div>' +

            '</div>' +


            '<div class="file-actions">' +


                '<button onclick="openStudyFile(' +

                    fileData.id +

                ')">' +

                    "Open" +

                '</button>' +


                '<button onclick="downloadStudyFile(' +

                    fileData.id +

                ')">' +

                    "Save" +

                '</button>' +


                '<button onclick="removeStudyFile(' +

                    fileData.id +

                ')">' +

                    "Delete" +

                '</button>' +


            '</div>';


        container.appendChild(
            item
        );

    });


    /* Apply current search */

    searchStudyFiles();

}


/* =========================================
   STUDY FILE SEARCH
========================================= */

function searchStudyFiles() {

    let searchInput =
        document.getElementById(
            "studyFileSearch"
        );


    let fileContainer =
        document.getElementById(
            "subjectFiles"
        );


    if (
        !searchInput ||
        !fileContainer
    ) {

        return;

    }


    let searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    let files =
        Array.from(
            fileContainer.querySelectorAll(
                ".study-file-item"
            )
        );


    let visibleCount = 0;


    files.forEach(function(file) {

        let fileName =
            file.textContent
                .toLowerCase();


        if (
            fileName.includes(
                searchText
            )
        ) {

            file.style.display =
                "";

            visibleCount++;

        } else {

            file.style.display =
                "none";

        }

    });


    let noResult =
        document.getElementById(
            "studyFileNoResult"
        );


    if (noResult) {

        noResult.remove();

    }


    if (
        files.length > 0 &&
        visibleCount === 0
    ) {

        let message =
            document.createElement(
                "div"
            );


        message.id =
            "studyFileNoResult";


        message.className =
            "study-file-no-result";


        message.textContent =
            "⌕ No files found";


        fileContainer.appendChild(
            message
        );

    }

}


/* =========================================
   FILE ICON
========================================= */

function getFileIcon(
    fileName,
    fileType
) {

    let name =
        fileName.toLowerCase();


    if (
        fileType.includes("pdf") ||
        name.endsWith(".pdf")
    ) {

        return "📕";

    }


    if (
        fileType.includes("image") ||
        name.endsWith(".png") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".webp")
    ) {

        return "🖼️";

    }


    if (
        fileType.includes("word") ||
        name.endsWith(".doc") ||
        name.endsWith(".docx")
    ) {

        return "📘";

    }


    if (
        fileType.includes("sheet") ||
        name.endsWith(".xls") ||
        name.endsWith(".xlsx")
    ) {

        return "📗";

    }


    if (
        fileType.includes("presentation") ||
        name.endsWith(".ppt") ||
        name.endsWith(".pptx")
    ) {

        return "📙";

    }


    if (
        name.endsWith(".txt")
    ) {

        return "📄";

    }


    return "📁";

}


/* =========================================
   FILE SIZE
========================================= */

function formatFileSize(bytes) {

    if (bytes === 0) {

        return "0 Bytes";

    }


    let units = [

        "Bytes",

        "KB",

        "MB",

        "GB"

    ];


    let index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    index =
        Math.min(
            index,
            units.length - 1
        );


    return (

        parseFloat(

            (
                bytes /
                Math.pow(
                    1024,
                    index
                )
            ).toFixed(2)

        ) +

        " " +

        units[index]

    );

}


/* =========================================
   OPEN FILE
========================================= */

function openStudyFile(id) {

    if (!studyDatabase) {

        alert(
            "Study storage is not ready."
        );

        return;

    }


    let transaction =
        studyDatabase.transaction(
            STORE_NAME,
            "readonly"
        );


    let store =
        transaction.objectStore(
            STORE_NAME
        );


    let request =
        store.get(id);


    request.onsuccess =
        function() {


            let fileData =
                request.result;


            if (!fileData) {

                return;

            }


            let url =
                URL.createObjectURL(
                    fileData.file
                );


            window.open(
                url,
                "_blank"
            );


            setTimeout(
                function() {

                    URL.revokeObjectURL(
                        url
                    );

                },
                10000
            );

        };

}


/* =========================================
   DOWNLOAD FILE
========================================= */

function downloadStudyFile(id) {

    if (!studyDatabase) {

        alert(
            "Study storage is not ready."
        );

        return;

    }


    let transaction =
        studyDatabase.transaction(
            STORE_NAME,
            "readonly"
        );


    let store =
        transaction.objectStore(
            STORE_NAME
        );


    let request =
        store.get(id);


    request.onsuccess =
        function() {


            let fileData =
                request.result;


            if (!fileData) {

                return;

            }


            let url =
                URL.createObjectURL(
                    fileData.file
                );


            let link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                fileData.name;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            setTimeout(
                function() {

                    URL.revokeObjectURL(
                        url
                    );

                },
                10000
            );

        };

}


/* =========================================
   DELETE STUDY FILE
========================================= */

async function removeStudyFile(id) {

    let confirmed =
        confirm(
            "Delete this study file?"
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteStudyFile(id);

        await displaySubjectFiles();

        await updateAllFileCounts();

    } catch (error) {

        console.error(
            "Delete file error:",
            error
        );

        alert(
            "Could not delete the file."
        );

    }

}


/* =========================================
   UPDATE FILE COUNTS
========================================= */

async function updateAllFileCounts() {

    if (!studyDatabase) {

        return;

    }


    let subjects = [

        "Physics",

        "Chemistry",

        "Mathematics",

        "Computer Science",

        "English"

    ];


    for (
        let i = 0;
        i < subjects.length;
        i++
    ) {


        let subject =
            subjects[i];


        let files =
            await getSubjectFiles(
                subject
            );


        let element =
            document.getElementById(
                "count-" + subject
            );


        if (element) {

            element.textContent =

                files.length +

                (
                    files.length === 1
                        ? " file"
                        : " files"
                );

        }

    }

}


/* =========================================
   CLOSE MODAL OUTSIDE CLICK
========================================= */

document.addEventListener(
    "click",
    function(event) {

        let modal =
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


/* =========================================
   ESCAPE KEY
========================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeSubject();

        }

    }
);


/* =========================================
   START STUDY DATABASE
========================================= */

openStudyDatabase()

    .then(function() {

        updateAllFileCounts();

    })

    .catch(function(error) {

        console.error(
            "Study file database error:",
            error
        );

    });


/* =========================================
   INITIALIZE STUDYFLOW
========================================= */

displayDate();

displayTasks();

displaySchedules();

updateProgress();

updateSubjectProgress();

updateStudyTime();

updateTodaySessions();

loadPomodoroSettings();

setStudyMode();