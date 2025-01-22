// Function to simulate getting data from api. Give url or json location
async function getData(url) {
  const gearSlots = await fetch(url);
  return await gearSlots.json();
}

// run the function to get gearSlotData and gearData
const gearSlotData = await getData('./json/gearSlots.json');
const gearData = await getData('./json/gear.json');

// Current equipped items
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

// Gets equipped items from last session, (Shouls probably have a button to reset this)
equippedItems = JSON.parse(localStorage.getItem('equippedItems'));

// Creates some containers, with base images for each gear slot (curently not all).
function appendGearSlot(gearSlot) {
  const gearSlotIconContainer = createNode('div', '', 'gear-slot-container');
  const gearSlotIcon = createNode(
    'img',
    `images/${gearSlot.slot}_slot.webp`,
    'gear-slot-icon'
  );
  gearSlotIconContainer.setAttribute('id', gearSlot.slot);
  gearSlotIconContainer.appendChild(gearSlotIcon);
  const parent = document.querySelector('#gear-list-container');
  gearSlotIconContainer.addEventListener('click', (event) => {
    appendPossibleGear(gearData.equipment, gearSlot);
  });
  parent.appendChild(gearSlotIconContainer);
}

gearSlotData.characterGearSlots.forEach((gearSlot) => {
  appendGearSlot(gearSlot);
});

// Runs when you click on a gear slot, shows a list of possible items for said gear slot
function appendPossibleGear(gearArray, currentGearSlot) {
  const parent = document.querySelector('#stats-container');
  parent.innerHTML = '';
  const possibleGear = gearArray.filter((gearPiece) => {
    return gearPiece.type === currentGearSlot.slot;
  });

  possibleGear.forEach((gearPiece) => {
    const possibleGearContainer = createNode('div', null, 'gear-container');
    possibleGearContainer.innerHTML = `
        <div class="flex-row">
            <div class="gear-icon-placeholder"></div>
            <h3>${gearPiece.name}</h3>
        </div>
        <div class="flex-column">
            <h3>${gearPiece.rarity}</h3>
            <h4>${gearPiece.stats[0].name}: ${gearPiece.stats[0].value}</h4>
            <h4>${gearPiece.stats[1].name}: ${gearPiece.stats[1].value}</h4>
        </div>
        `;
    possibleGearContainer.addEventListener('click', () => {
      equippedItems[gearPiece.type] = gearPiece;
      updateEquippedItems();
      updateLocalStorage();
    });
    parent.appendChild(possibleGearContainer);
  });
}

// Updates equipped items, and adds a modal that shows up when you hover the equipment slot (this is scuffed as fuck lol)
function updateEquippedItems() {
  // Gets all gearslot containers (This is to get their ID)
  const allGearSlots = [...document.querySelectorAll('.gear-slot-container')];
  const filteredGearSlots = allGearSlots.filter((gearSlotElement) => {
    // Filter to find slots that has equipped items. equippedItems[id].type will tell you if there is an equipped item or not.
    const { id } = gearSlotElement;
    if (equippedItems[id].type) return true;
  });
  // Very cursed way of adding a remove item button, + removing it from the equippedItems object.
  filteredGearSlots.forEach((gearSlot) => {
    if (!gearSlot.querySelector('button')) {
      const removeButton = document.createElement('button');
      removeButton.classList.add('remove-button');
      removeButton.textContent = 'X';
      //eventlistener to remove button, removes itself if clicked
      removeButton.addEventListener('click', () => {
        gearSlot.removeChild(removeButton);
        if (equippedItems[gearSlot.id]) {
          // Remove event listener again, also remove modal if it was currently displaying.
          gearSlot.removeEventListener('mouseover', hoverModal);
          const modal = document.querySelector('.modal');
          if (modal) document.body.removeChild(modal);
        }
        // After removing the item from equippedItems we calculate and update local storage again
        equippedItems[gearSlot.id] = {};
        calculateValues();
        updateLocalStorage();
        gearSlot.style.backgroundColor = '#22004422';
      });
      gearSlot.appendChild(removeButton);
    }
    // If we didnt calculate values after removing the item, we calculate after (idk why it didnt work to just put it here.)
    calculateValues();
    const currentItem = equippedItems[gearSlot.id];
    gearSlot.style.backgroundColor = '#666677';

    // Super cursed modal appended with position: absolute;
    function hoverModal() {
      const modal = document.createElement('div');
      modal.classList.add('modal');
      modal.innerHTML = `
              <div class="flex-row">
              <div class="gear-icon-placeholder"></div>
              <h3>${currentItem.name}</h3>
              </div>
              <div class="flex-column">
              <h3>${currentItem.rarity}</h3>
              <h4>${currentItem.stats[0].name}: ${currentItem.stats[0].value}</h4>
              <h4>${currentItem.stats[1].name}: ${currentItem.stats[1].value}</h4>
              </div>
            `;
      const { x, y } = gearSlot.getBoundingClientRect();
      modal.style.top = `${y}px`;
      modal.style.left = `${x + 75}px`;
      document.body.appendChild(modal);
      // Constuction (Function as a Const, idk why i used this here and nowhere else)
      // Handles a problem where mouseout event tried to remove child of another parent.
      const handleMouseOut = () => {
        if (modal.parentNode) {
          document.body.removeChild(modal);
        }
        gearSlot.removeEventListener('mouseout', handleMouseOut);
      };
      gearSlot.addEventListener('mouseout', handleMouseOut);
    }
    gearSlot.addEventListener('mouseover', hoverModal);
  });
}
// Updates local storage with equipped items.
function updateLocalStorage() {
  const json = JSON.stringify(equippedItems);
  localStorage.setItem('equippedItems', json);
}

// Calculates total values of stats. Should probably save as array so we can iterate and not hardcode the innerHTML later lol.
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
        if (totalStats[stat.name]) {
          totalStats[stat.name] += stat.value;
        } else {
          totalStats[stat.name] = stat.value;
        }
      });
    }
  });

  // Got bored, and didnt turn object to array, so here we do the thing we dont like lol
  document.querySelector('#total-values-container').innerHTML = `
    <h1>STATS</h1>
    <h3>Health: ${totalStats.health || 0}</h3>
    <h3>Armor: ${totalStats.armor || 0}</h3>
    <h3>Style: ${totalStats.style || 0}</h3>
    <h3>Mana: ${totalStats.mana || 0}</h3>
    `;
}

// Simple function to create a new node/element. Accepts a type, content and ClassName, content can be an URL, if the type is "img"
function createNode(type, content, className) {
  const node = document.createElement(type);
  node.classList.add(className);

  if (type === 'img') {
    node.src = content;
  } else if (content === null) {
    node.textContent = '';
  } else {
    node.textContent = content;
  }

  return node;
}
// if we have data from localStorage we want to update right away when script is loaded.
updateEquippedItems();
