function previewImage() {
    const file = document.getElementById("imageInput").files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const imagePreview = document.getElementById("imagePreview");
        const imagePreviewContainer = document.getElementById("imagePreviewContainer");
        imagePreview.src = e.target.result;
        imagePreviewContainer.style.display = "block";
    };

    if (file) {
        reader.readAsDataURL(file);
    }
}

function addTask() {
    const input = document.getElementById("taskInput");
    const taskText = input.value.trim();
    const imagePreview = document.getElementById("imagePreview");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");
    const imageSrc = imagePreview.src;

    if (taskText === "") return;

    const li = document.createElement("li");

    // Task text
    const taskTextElement = document.createElement("span");
    taskTextElement.textContent = taskText;
    taskTextElement.classList.add("task-text");
    li.appendChild(taskTextElement);

    // Image (if any)
    if (imageSrc && imagePreviewContainer.style.display !== "none") {
        const img = document.createElement("img");
        img.src = imageSrc;
        img.classList.add("task-image");
        li.appendChild(img);
    }

    // Toggle done on click
    li.onclick = () => li.classList.toggle("done");

    // Remove button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.classList.add("remove-btn");
    removeBtn.onclick = (e) => {
        e.stopPropagation(); // prevent triggering li toggle
        li.remove();
    };
    li.appendChild(removeBtn);

    document.getElementById("taskList").appendChild(li);

    // Reset inputs
    input.value = "";
    imagePreview.src = "";
    imagePreviewContainer.style.display = "none";
}
