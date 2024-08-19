import { getVideoElement } from "../constants";

function setupDragAndDrop() {
    const dropOverlay = document.getElementById('drag-n-drop');
    const body = document.body;

    body.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dropOverlay?.classList.add('active');
    });

    body.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    body.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropOverlay?.classList.remove('active');
    });

    body.addEventListener('drop', (e) => {
        e.preventDefault();
        dropOverlay?.classList.remove('active');
        const file = e.dataTransfer?.files[0];
        if (file && (file.type === 'video/mp4' || file.type === 'video/webm')) {
            const videoURL = URL.createObjectURL(file);
            const video = getVideoElement();
            video.src = videoURL;
            video.load();
            video.play();
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupDragAndDrop();
});
