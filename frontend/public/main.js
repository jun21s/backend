const showTechStackBtn = document.getElementById("showTechStackBtn");
const techStackOutput = document.getElementById("techStackOutput");

showTechStackBtn.addEventListener("click", () => {
    fetch("/api/techStack")
        .then((response) => response.json())
        .then((techStackData) => {
            techStackOutput.innerHTML = `
                <h2>기술 스택</h2>
                <ul>
                    ${techStackData.techStack.map((tech) => `<li>${tech}</li>`).join("")}
                </ul>
            `;
        })
        .catch((error) => {
            console.error("Error fetching tech stack:", error);
            techStackOutput.innerHTML = "<p>기술 스택을 불러오는데 문제가 발생했습니다.</p>";
        });
});
