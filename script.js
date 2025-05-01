// Preview image before adding task
function previewImage() {
    const file = document.getElementById("imageInput").files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const imagePreview = document.getElementById("imagePreview");
        const imagePreviewContainer = document.getElementById("imagePreviewContainer");

        imagePreview.src = e.target.result;
        imagePreview.alt = "Task Image Preview";
        imagePreviewContainer.style.display = "block";
    };

    if (file) {
        reader.readAsDataURL(file);
    }
}

// Add a new task with or without image
function addTask() {
    const input = document.getElementById("taskInput");
    const taskText = input.value.trim();
    const imagePreview = document.getElementById("imagePreview");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const imageSrc = imagePreview.src;

    if (taskText === "") return;

    const task = {
        text: taskText,
        image: imageSrc && imagePreviewContainer.style.display !== "none" ? imageSrc : "",
        done: false
    };

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));

    renderTasks();

    input.value = "";
    imagePreview.src = "";
    imagePreview.alt = "";
    imagePreviewContainer.style.display = "none";
}

// Render tasks from localStorage
function renderTasks() {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");

        if (task.done) li.classList.add("done");

        const taskTextElement = document.createElement("span");
        taskTextElement.textContent = task.text;
        taskTextElement.classList.add("task-text");
        li.appendChild(taskTextElement);

        if (task.image) {
            const img = document.createElement("img");
            img.src = task.image;
            img.classList.add("task-image");
            li.appendChild(img);
        }

        li.onclick = () => {
            li.classList.toggle("done");
            toggleTaskDone(index);
        };

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "❌";
        removeBtn.classList.add("remove-btn");
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeTask(index);
        };
        li.appendChild(removeBtn);

        taskList.appendChild(li);
    });
}

// Toggle task done state and update storage
function toggleTaskDone(index) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks[index].done = !tasks[index].done;
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Remove a task from localStorage and re-render
function removeTask(index) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.splice(index, 1);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
}

// Dark mode toggle
document.getElementById("darkModeToggle").addEventListener("change", function () {
    document.body.classList.toggle("dark", this.checked);
});

// Detect system theme on load and set dark mode automatically
function detectSystemTheme() {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (isDarkMode) {
        document.body.classList.add("dark");
        document.getElementById("darkModeToggle").checked = true;
    } else {
        document.body.classList.remove("dark");
        document.getElementById("darkModeToggle").checked = false;
    }
}

detectSystemTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectSystemTheme);

// Initial rendering of tasks on page load
window.onload = renderTasks;
