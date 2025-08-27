import data from "./content-data.js";

const totalProcessTimeDiv = document.querySelector("#totalProcessTime");
const totalStreamTimeDiv = document.querySelector("#totalStreamTime");
const totalResponseTimeDiv = document.querySelector("#totalResponseTime");
const response = document.querySelector("#response");
const tableContainer = document.querySelector("#table-container"); // Assuming you have a div to hold the table


// Initialize the stream start and end timestamps
let startOfPromptStreamTimestamp;
let endOfPromptStreamTimestamp;

let table; // Declare table variable in a scope accessible by multiple functions

document.querySelector("#runModel").addEventListener("click", async () => {
    // Create the table only once when the button is clicked for the first time
  if (!table) {
    table = createTable();
  } else {
    // If the table already exists, clear its body for a new run
    const tbody = table.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '';
    }
  }
  for (const item of data) {
    initialize();
    let session = await createModel();
    await runPrompt(session, item.text, item.title, item.wordCount);
  }
});

function createTable() {
  const newTable = document.createElement('table');
  const tbody = document.createElement('tbody');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Title', 'Word Count', 'Total Process Time', 'Total Stream Time', 'Total Response Time'].forEach(headerText => {
    const th = document.createElement('th');
    th.textContent = headerText;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  newTable.appendChild(thead);
  newTable.appendChild(tbody);
  tableContainer.appendChild(newTable);
  return newTable;
}

function initialize () {
    // Clear previous response
    totalProcessTimeDiv.innerHTML = "running...";
    totalStreamTimeDiv.innerHTML = ""
    totalResponseTimeDiv.innerHTML = "";
    response.innerHTML = "";
    startOfPromptStreamTimestamp = "";
    endOfPromptStreamTimestamp = "";
}

async function createModel() {
  // const summarizeContent = document.querySelector("#summarize-content").value;
  const session = await LanguageModel.create({
    expectedInputs: [{
      type: "text",
      languages: ["en"]
    }],
    // See below section
    expectedOutputs: [{
      type: "text",
      languages: ["en"]
    }],
  });
  return session;
};

async function runPrompt(session, summaryContent, title, wordCount) {
  // Log timestamp when processing started
  const stream = await session.promptStreaming(`Please summarize the following content in 3 bullet points: ${summaryContent}`);
  const startOfProcessingTimestamp = Date.now();
  console.log(`start of processing at: ${startOfProcessingTimestamp}`)
  
  let totalProcessTime;

  for await (const chunk of stream) {
    // Only set the start timestamp on the first chunk
    if (!startOfPromptStreamTimestamp) {
      startOfPromptStreamTimestamp = Date.now();
      console.log(`start of streaming at: ${startOfProcessingTimestamp}`);
      totalProcessTime = startOfPromptStreamTimestamp - startOfProcessingTimestamp
      totalProcessTimeDiv.innerHTML = `Total process time: ${totalProcessTime/1000}s`;
    }
    response.innerHTML += chunk;
  }
  
  endOfPromptStreamTimestamp = Date.now();
  console.log(`end of processing at: ${endOfPromptStreamTimestamp}`)

  // Calculate and display the total stream time (first chunk to last chunk)
  const totalStreamTime = endOfPromptStreamTimestamp - startOfPromptStreamTimestamp;
  totalStreamTimeDiv.innerHTML = `Total stream time: ${totalStreamTime/1000}s`;
  const totalResponseTime = endOfPromptStreamTimestamp - startOfProcessingTimestamp;
  totalResponseTimeDiv.innerHTML = `Total response time: ${totalResponseTime/1000}s`; 

    // Add a new row to the table with the calculated values
    const row = document.createElement('tr');
    const tbody = table.querySelector('tbody');
    
    const titleCell = document.createElement('td');
    titleCell.textContent = title;
    row.appendChild(titleCell);

    const wordCountCell = document.createElement('td');
    wordCountCell.textContent = wordCount;
    row.appendChild(wordCountCell);

    const processTimeCell = document.createElement('td');
    processTimeCell.textContent = `${totalProcessTime/1000}`;
    row.appendChild(processTimeCell);

    const streamTimeCell = document.createElement('td');
    streamTimeCell.textContent = `${totalStreamTime/1000}`;
    row.appendChild(streamTimeCell);

    const responseTimeCell = document.createElement('td');
    responseTimeCell.textContent = `${totalResponseTime/1000}`;
    row.appendChild(responseTimeCell);

    tbody.appendChild(row);

  session.destroy();  
}


