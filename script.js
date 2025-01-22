// Function to fetch JSON data from a given URL
async function getData(url) {
  const gearSlots = await fetch(url); // Fetch data from the URL
  return await gearSlots.json(); // Parse and return JSON data
}

// Fetch gear slot and gear data from local JSON files
// Currently getting dummy data generated by ChatGPT, can eventually be replaced with an actual API.
const gearSlotData = await getData('./json/gearSlots.json'); // Fetch gear slots
const gearData = await getData('./json/gear.json'); // Fetch gear information

let equippedItems = {
  head: {},
  chest: {},
  hands: {},
  wrist: {},
  legs: {},
  feet: {},
  shoulders: {},
  back: {},
  neck: {},
};

equippedItems = JSON.parse(localStorage.getItem('equippedItems'));

// Appends a gear slot icon to the UI
function appendGearSlot(gearSlot) {
  // Create an image node for the gear slot icon
  const gearSlotIconContainer = createNode('div', '', 'gear-slot-container');

  const gearSlotIcon = createNode(
    'img',
    `images/${gearSlot.slot}_slot.webp`, // Path to gear slot icon image
    'gear-slot-icon' // CSS class for styling
  );
  gearSlotIconContainer.setAttribute('id', gearSlot.slot);

  gearSlotIconContainer.appendChild(gearSlotIcon);
  // Select the container for displaying all gear slot icons
  const parent = document.querySelector('#gear-list-container');

  // Add click event listener to handle showing possible gear items for the slot
  gearSlotIconContainer.addEventListener('click', (event) => {
    appendPossibleGear(gearData.equipment, gearSlot); // Show gear items for the clicked slot
  });

  // Append the gear slot icon to the UI
  parent.appendChild(gearSlotIconContainer);
}

// Loop through each gear slot and append it to the UI
gearSlotData.characterGearSlots.forEach((gearSlot) => {
  appendGearSlot(gearSlot);
});

// Appends a list of possible gear items for the selected gear slot
function appendPossibleGear(gearArray, currentGearSlot) {
  const parent = document.querySelector('#stats-container'); // Container for gear details
  parent.innerHTML = ''; // Clear previous gear details

  // Filter gear items that match the current gear slot type
  const possibleGear = gearArray.filter((gearPiece) => {
    return gearPiece.type === currentGearSlot.slot; // Return true if gear type matches slot
  });

  // Iterate through each matching gear piece and display it
  possibleGear.forEach((gearPiece) => {
    // Create a container for the gear piece
    const possibleGearContainer = createNode('div', null, 'gear-container');
    // Add HTML for displaying gear details (name, rarity, stats)
    possibleGearContainer.innerHTML = `
      <div class="flex-row">
          <div class="gear-icon-placeholder"></div> <!-- Placeholder for gear icon, could be an image-->
          <h3>${gearPiece.name}</h3> <!-- Gear name -->
      </div>
      <div class="flex-column">
          <h3>${gearPiece.rarity}</h4> <!-- Gear rarity -->
          <h4>${gearPiece.stats[0].name}: ${gearPiece.stats[0].value}</h4> <!-- first gear stat -->
          <h4>${gearPiece.stats[1].name}: ${gearPiece.stats[1].value}</h4> <!-- second gear stat -->
      </div>
      `;
    possibleGearContainer.addEventListener('click', () => {
      equippedItems[gearPiece.type] = gearPiece;
      updateEquippedItems();
      updateLocalStorage();
    });
    // Append the gear piece details to the parent container
    parent.appendChild(possibleGearContainer);
  });
}
function updateEquippedItems() {
  const allGearSlots = [...document.querySelectorAll('.gear-slot-container')];
  const filteredGearSlots = allGearSlots.filter((gearSlotElement) => {
    const { id } = gearSlotElement;
    if (equippedItems[id].type) return true;
  });

  filteredGearSlots.forEach((gearSlot) => {
    if (!gearSlot.querySelector('button')) {
      const removeButton = document.createElement('button');
      removeButton.classList.add('remove-button');
      removeButton.textContent = 'X';

      removeButton.addEventListener('click', () => {
        gearSlot.removeChild(removeButton);
        if (equippedItems[gearSlot.id]) {
          gearSlot.removeEventListener('mouseover', hoverModal);
          const modal = document.querySelector('.modal');
          if (modal) document.body.removeChild(modal);
        }
        equippedItems[gearSlot.id] = {};
        calculateValues();
        updateLocalStorage();
        gearSlot.style.backgroundColor = '#22004422';
      });
      gearSlot.appendChild(removeButton);
    }

    // Get the equipped item for the currentSlot in iteration
    const currentItem = equippedItems[gearSlot.id];
    // Small change to indicate that something is equipped (cba to actually get the images atm)
    gearSlot.style.backgroundColor = '#666677';

    calculateValues();
    // Define the hoverModal function outside of addEventListener
    function hoverModal() {
      const modal = document.createElement('div');
      modal.classList.add('modal');
      modal.innerHTML = `
            <div class="flex-row">
            <div class="gear-icon-placeholder"></div> <!-- Placeholder for gear icon, could be an image-->
            <h3>${currentItem.name}</h3> <!-- Gear name -->
            </div>
            <div class="flex-column">
            <h3>${currentItem.rarity}</h4> <!-- Gear rarity -->
            <h4>${currentItem.stats[0].name}: ${currentItem.stats[0].value}</h4> <!-- first gear stat -->
            <h4>${currentItem.stats[1].name}: ${currentItem.stats[1].value}</h4> <!-- second gear stat -->
            </div>
          `;
      const { x, y } = gearSlot.getBoundingClientRect();
      modal.style.top = `${y}px`;
      modal.style.left = `${x + 75}px`;

      document.body.appendChild(modal);

      const handleMouseOut = () => {
        // Ensure the modal is still a child of the body before trying to remove it
        if (modal.parentNode) {
          document.body.removeChild(modal);
        }
        // Remove the event listener after the modal is removed
        gearSlot.removeEventListener('mouseout', handleMouseOut);
      };

      gearSlot.addEventListener('mouseout', handleMouseOut);
    }

    // Add the event listener for mouseover
    gearSlot.addEventListener('mouseover', hoverModal);
  });
}

function updateLocalStorage() {
  const json = JSON.stringify(equippedItems);
  localStorage.setItem('equippedItems', json);
}

function calculateValues() {
  const equippedItemsArray = Object.entries(equippedItems).map(
    ([slot, item]) => {
      return { slot, item };
    }
  );

  let totalStats = {};

  equippedItemsArray.forEach(({ item }) => {
    if (item.stats) {
      item.stats.forEach((stat) => {
        if (stat.name === 'durability') return;
        // If the stat already exists in totalStats, add to its value
        if (totalStats[stat.name]) {
          totalStats[stat.name] += stat.value;
        } else {
          // If the stat doesn't exist, create it in totalStats
          totalStats[stat.name] = stat.value;
        }
      });
    }
  });
  console.log(totalStats);
  // Print the total stats
  document.querySelector('#total-values-container').innerHTML = `
  <h1>STATS</h1>
  <h3>Health: ${totalStats.health || 0}</h3>
  <h3>Armor: ${totalStats.armor || 0}</h3>
  <h3>Style: ${totalStats.style || 0}</h3>
  <h3>Mana: ${totalStats.mana || 0}</h3>
  `;
}

// Helper function to create a new DOM node
// Example usage: createNode("div", "text-to-be-displayed", "container-class")
function createNode(type, content, className) {
  const node = document.createElement(type); // Create the specified node type (e.g., div, img)

  // Add CSS class to the node
  node.classList.add(className);

  // Handle specific behavior for images
  if (type === 'img') {
    node.src = content; // Set the image source
  } else if (content === null) {
    node.textContent = ''; // Set empty text content for non-image nodes without content
  } else {
    node.textContent = content; // Set text content for the node
  }

  return node; // Return the created node
}
updateEquippedItems();
