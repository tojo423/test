/*
    this file supplements the original game code and runs our hack code
*/

/*
    contains the global hack state usable throughout the hack
*/
const hackState = {
  map: null,
  mapContainer: null,
  isEnabled: true,
  rootElement: null,
  markers: {},
  eventElement: null,
  renderEvent: null,
  colorsEnabled: true,
  costFilterMin: 0,
  costFilterMax: 1000,
  showLowestOnly: false,
  lowestCost: 5,
};
window.__hackState = hackState;

/*
    class to create and control the hack gui
*/
class HackGui {
  windowDiv;
  toggleButtonDiv;
  isShowing = true;

  constructor() {
    this.createToggleButton();
    this.createWindow();
  }

  /*
    triggered when the toggle button is clicked
  */
  toggleButtonClicked() {
    this.isShowing = !this.isShowing;

    if (this.isShowing) {
      this.windowDiv.classList.remove("my-hidden");
    } else {
      this.windowDiv.classList.add("my-hidden");
    }
  }

  /*
    creates a complex checkbox input

    params:
        -labelText : string - the text of the label
        -name : string - name to set for the input

    returns object - ref object
        -state : State
        -checkboxContainer : HtmlElement - the root element of the checkbox
  */
  createCheckboxInput(labelText, name, checked) {
    /*
        .my-checkbox-container {
        .my-checkbox-text {
        .my-checkbox-input {
        .my-checkbox-checkmark {
    */

    const state = {
      isChecked: checked,
    };

    const checkboxContainer = document.createElement("label");
    checkboxContainer.classList.add("my-checkbox-container");
    checkboxContainer.setAttribute("for", name);

    const textSpan = document.createElement("span");
    textSpan.classList.add("my-checkbox-text");
    textSpan.innerText = labelText;
    checkboxContainer.appendChild(textSpan);

    const checkboxInput = document.createElement("input");
    checkboxInput.type = "checkbox";
    checkboxInput.classList.add("my-checkbox-input");
    checkboxInput.setAttribute("name", name);
    checkboxInput.setAttribute("readonly", true);
    checkboxInput.setAttribute("checked", checked);

    checkboxContainer.appendChild(checkboxInput);

    const checkmarkSpan = document.createElement("span");
    checkmarkSpan.classList.add("my-checkbox-checkmark");
    checkboxContainer.appendChild(checkmarkSpan);

    if (checked) {
      checkmarkSpan.classList.add("my-checked");
    }

    checkmarkSpan.addEventListener("click", () => {
      state.isChecked = !state.isChecked;

      if (state.isChecked) {
        // checkmarkSpan.innerText = "✔";
        checkmarkSpan.classList.add("my-checked");
        checkboxInput.setAttribute("checked", true);
        checkboxInput.dispatchEvent(new Event("change"));
      } else {
        // checkmarkSpan.innerText = "";
        checkmarkSpan.classList.remove("my-checked");
        checkboxInput.setAttribute("checked", false);
        checkboxInput.dispatchEvent(new Event("change"));
      }
    });

    // checkboxInput.addEventListener("change", () => {
    //   console.log(
    //     "checkbox input changed",
    //     checkboxInput.getAttribute("checked")
    //   );
    // });

    const checkboxInputRef = {
      state,
      checkboxContainer,
      textSpan,
      checkboxInput,
      checkmarkSpan,
    };

    return checkboxInputRef;
  }

  createTextInput({ placeholder, min, max, value }) {
    const textInput = document.createElement("input");
    textInput.type = "number";
    textInput.placeholder = placeholder;
    textInput.classList.add("my-text-input");
    textInput.min = min;
    textInput.max = max;
    textInput.value = value;

    const ref = {
      textInput,
    };
    return ref;
  }

  /*
    creates the hack window
  */
  createWindow() {
    const windowDiv = document.createElement("div");
    windowDiv.classList.add("hack-window");
    hackState.rootElement.appendChild(windowDiv);
    this.windowDiv = windowDiv;

    /*
        create header
    */
    const headerContainer = document.createElement("div");
    headerContainer.classList.add("my-header-container");
    windowDiv.appendChild(headerContainer);

    const headerText = document.createElement("div");
    headerText.classList.add("my-header-text");
    headerText.classList.add("FitText");
    headerText.innerText = "Settings";
    headerContainer.appendChild(headerText);

    /*
        create form
    */
    const form = document.createElement("form");
    form.classList.add("my-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
    });
    windowDiv.appendChild(form);

    /*
        inputs
    */

    /*
        show color checkbox
    */
    const pluginEnabledCheckbox = this.createCheckboxInput(
      "Plugin Enabled",
      "plugin-enabled",
      true
    );
    pluginEnabledCheckbox.checkboxInput.addEventListener("change", (event) => {
      const checked =
        pluginEnabledCheckbox.checkboxInput.getAttribute("checked") == "true";
      console.log("hack enabled:", checked);
      hackState.isEnabled = checked;

      if (checked) {
        // console.log("inside checked true", typeof checked);
      } else {
        // console.log("destroying markers...");
        for (let key in hackState.markers) {
          //   console.log("destroying marker with key", key);
          const marker = hackState.markers[key];
          marker.destroy();
        }
        hackState.markers = {};
      }
    });
    form.appendChild(pluginEnabledCheckbox.checkboxContainer);

    /*
        create cost range inputs  
    */
    const rangeContainer = document.createElement("div");
    rangeContainer.classList.add("my-range-container");
    form.appendChild(rangeContainer);

    const rangeLabel = document.createElement("div");
    rangeLabel.classList.add("my-label");
    rangeLabel.innerText = "Travel Cost Range";
    rangeContainer.appendChild(rangeLabel);

    const updateMarkersVisibility = () => {
      for (let key in hackState.markers) {
        const marker = hackState.markers[key];
        marker.updateVisibility();
      }
    };

    const constMinInput = this.createTextInput({
      placeholder: "Min",
      min: 0,
      max: 1000,
      value: 0,
    });
    constMinInput.textInput.addEventListener("change", (e) => {
      const costMin = Number(e.target.value);
      hackState.costFilterMin = costMin;
      updateMarkersVisibility();
    });
    rangeContainer.appendChild(constMinInput.textInput);

    const costMaxInput = this.createTextInput({
      placeholder: "Max",
      min: 0,
      max: 1000,
      value: 1000,
    });
    costMaxInput.textInput.addEventListener("change", (e) => {
      const constMax = Number(e.target.value);
      hackState.costFilterMax = constMax;
      updateMarkersVisibility();
    });
    rangeContainer.appendChild(costMaxInput.textInput);

    /*
        show lowest only checkbox
    */
    const showLowestCheckbox = this.createCheckboxInput(
      "Show Lowest Cost",
      "show-lowest-cost",
      false
    );
    showLowestCheckbox.checkboxInput.addEventListener("change", (event) => {
      const checked =
        showLowestCheckbox.checkboxInput.getAttribute("checked") == "true";
      console.log("show lowest enabled:", checked);
      hackState.showLowestOnly = checked;

      if (checked) {
        console.log("show lowest checkbox is checked");
        let lowestTravelCost = 1001;

        // console.log("hackstate markers", hackState.markers);
        for (let key in hackState.markers) {
          const marker = hackState.markers[key];
          const propertyData = marker.propertyData;
          console.log("cur property data", propertyData);
          const travelCost = propertyData.teleportPrice;
          console.log("cur travel cost", travelCost);
          if (travelCost < lowestTravelCost) {
            lowestTravelCost = travelCost;
          }
        }
        console.log("lowest cost", lowestTravelCost);
        hackState.lowestCost = lowestTravelCost;
      } else {
        hackState.lowestCost = null;
      }

      for (let key in hackState.markers) {
        const marker = hackState.markers[key];
        marker.updateVisibility();
      }
    });
    form.appendChild(showLowestCheckbox.checkboxContainer);

    /*
        show color checkbox
    */
    const showColorsCheckbox = this.createCheckboxInput(
      "Show Colors",
      "show-colors",
      true
    );
    showColorsCheckbox.checkboxInput.addEventListener("change", (event) => {
      const checked =
        showColorsCheckbox.checkboxInput.getAttribute("checked") == "true";
      console.log("colors enabled:", checked);
      hackState.colorsEnabled = checked;

      for (let key in hackState.markers) {
        console.log("setting marker color enabled with key", key);
        const marker = hackState.markers[key];
        marker.setColorsEnabled(checked);
      }
    });
    form.appendChild(showColorsCheckbox.checkboxContainer);
  }

  /*
    creates the hack gui toggle button
  */
  createToggleButton() {
    const buttonDiv = document.createElement("div");
    buttonDiv.classList.add("hack-toggle-button");

    const iconImg = document.createElement("img");
    iconImg.src = "https://cdn-icons-png.flaticon.com/128/907/907226.png";
    buttonDiv.appendChild(iconImg);

    hackState.rootElement.appendChild(buttonDiv);

    this.toggleButtonDiv = buttonDiv;

    buttonDiv.addEventListener("click", () => {
      this.toggleButtonClicked();
    });
  }
}

/*
    class to create and control markers on the map

    markers are the hovering text labels on the map

    technically we can register markers with built-in functions in the game's code
    but, we'd have to modify it greatly to handle our cases
    so it's best to re-implement the marker functionality with the barebones of what we need
*/
class Marker {
  element;
  propertyData;
  static properyDataCache = {};

  /*
    sets this marker's visibility

    params:
        visible : boolean - whether or not to show this marker
  */
  setVisible(visible) {
    if (visible) {
      this.element.classList.remove("my-hidden");
    } else {
      this.element.classList.add("my-hidden");
    }
  }

  setColorsEnabled(enabled) {
    if (enabled) {
      this.element.classList.remove("my-no-color");
    } else {
      this.element.classList.add("my-no-color");
    }
  }

  /*
    creates a new marker instance

    args:
        object - an object containing the following properties
            propertyId : number - id of property this marker is for
            mapContainer : HtmlElement - map container element reference
            map : Map - main map reference
            lng : number - property center longitude
            lat : number - proeprty center latitude
  */
  constructor({ propertyId, mapContainer, map, lng, lat }) {
    Object.assign(this, { propertyId, mapContainer, map, lng, lat });

    const element = document.createElement("div");
    element.classList.add("dntmXU");
    element.classList.add("mapboxgl-marker");
    if (!hackState.colorsEnabled) {
      element.classList.add("my-no-color");
    }
    element.innerText = "...";
    this.element = element;

    mapContainer.appendChild(element);

    this.setVisible(false);
    this.update();

    /*
        fetch property data asynchronously and update marker
    */
    this.fetchPropertyData().then((data) => {
      this.propertyData = data;
      this.element.innerText = data.teleportPrice;

      const teleportPrice = data.teleportPrice;

      let level;
      if (teleportPrice <= 20) {
        level = 1;
      } else if (teleportPrice <= 40) {
        level = 2;
      } else if (teleportPrice <= 60) {
        level = 3;
      } else if (teleportPrice <= 80) {
        level = 4;
      } else if (teleportPrice <= 99999) {
        level = 5;
      }

      this.setColor(level);
      this.updateVisibility();
    });
  }

  updateVisibility() {
    if (this.propertyData) {
      const propertyData = this.propertyData;
      const teleportPrice = propertyData.teleportPrice;
      if (hackState.showLowestOnly && hackState.lowestCost) {
        if (teleportPrice == hackState.lowestCost) {
          this.setVisible(true);
        } else {
          this.setVisible(false);
        }
      } else {
        const costMin = hackState.costFilterMin;
        const costMax = hackState.costFilterMax;

        if (teleportPrice >= costMin && teleportPrice <= costMax) {
          this.setVisible(true);
        } else {
          this.setVisible(false);
        }
      }
    }
  }

  /*
    re-calculates screen position and applies transform
  */
  update() {
    const screenPos = this.map.project({ lng: this.lng, lat: this.lat });
    this.screenPos = screenPos;
    this.element.style = `transform: translate(-50%, -50%) translate(${screenPos.x}px, ${screenPos.y}px) rotateX(0deg) rotateZ(0deg);`;
  }

  /*
    fetch data for this marker's property

    returns PropertyData

    PropertyData {
        teleportPrice : number - the teleport price for this property
    }
  */
  fetchPropertyData() {
    const cachedData = Marker.properyDataCache[this.propertyId];
    if (cachedData) {
      return Promise.resolve(cachedData);
    } else {
      return fetch("https://api.upland.me/properties/" + this.propertyId, {
        headers: {
          "user-agent": `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36`,
        },
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          const transformed = { teleportPrice: data.teleport_price };
          //Marker.properyDataCache[this.propertyId] = transformed;
          return transformed;
        });
    }
  }

  removeColor() {}

  destroy() {
    // console.log("marker destroy called", this);
    this.element.remove();
  }

  /*
    sets the color of this marker based on a level 1-5
  */
  setColor(level) {
    // console.log("setColor", this.propertyData, level);

    const colorClasses = [
      "marker-cost-1",
      "marker-cost-2",
      "marker-cost-3",
      "marker-cost-4",
      "marker-cost-5",
    ];

    for (let colorClass of colorClasses) {
      this.element.classList.remove(colorClass);
    }

    if (level) {
      this.element.classList.add("marker-cost-" + level);
    } else {
      // do nothing
    }
  }
}

/*
    dynamically create our own styles
*/
const createStylesheet = () => {
  var style = document.createElement("style");
  style.type = "text/css";
  style.innerHTML = `
    .my-range-container {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        margin-top: 5px;
        margin-bottom: 5px;
    }

    .my-label {
        display: flex;
        -webkit-box-pack: center;
        justify-content: center;
        text-align: center;
        color: rgb(153, 153, 153);
        letter-spacing: 0.5px;
        font-family: "Avenir Next", sans-serif;
        font-size: 14px;
        font-weight: 600;
        line-height: 18px;
    }

    div.mapboxgl-marker.my-no-color {
        background-color: rgba(76, 175, 80, 0) !important;
    }

    .marker-cost-1 {
        background-color: #58EFEC !important;
    }

    .marker-cost-2 {
        background-color: #7CCAD5 !important;
    }

    .marker-cost-3 {
        background-color: #A0A6BE !important;
    }

    .marker-cost-4 {
        background-color: #C481A7 !important;
    }

    .marker-cost-5 {
        background-color: #E85C90 !important;
    }

    .my-text-input {
        outline: none;
        padding: 5px;
        font-family: "Avenir Next", sans-serif;
        font-weight: 800;
        font-size: 12px;
        line-height: 10px;
        letter-spacing: 1px;
        width: 65px;
        background: rgb(255, 255, 255);
        border: 2px solid rgb(153, 153, 153);
        box-sizing: border-box;
        border-radius: 10px;
        color: rgb(35, 35, 35);
        display: block;
    }

    .hack-toggle-button {
        position: fixed;
        width: 65px;
        right: 24px;
        top: calc(85px + 65px + var(--safe-area-inset-top,0px));
        z-index: 850;
        transition: right 0.3s ease 0s;
        width: 32px;
        height: 32px;
        border-radius: 50px;
        background-color: rgb(255, 255, 255);
        border: 2px solid rgb(35, 35, 35);
        box-shadow: rgb(0 0 0 / 50%) 0px -1px 5px, rgb(0 0 0 / 25%) 0px -6px 0px inset;
        display: flex;
        -webkit-box-pack: center;
        justify-content: center;
        -webkit-box-align: center;
        align-items: center;
        cursor: pointer;
    }

    .hack-toggle-button img {
        width: 20px;
        height: 20px;
    }

    .hack-window {
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        animation: 0.3s ease 0s 1 normal none running fadeOpacityIn;
        border: 2px solid rgb(35, 35, 35);
        box-shadow: rgb(0 0 0 / 50%) 0px 0px 4px;
        border-radius: 22px;

        position: fixed;
        width: 300px;
        height: 280px;
        right: 24px;
        top: calc(85px + 65px + 65px + var(--safe-area-inset-top,0px));
        z-index: 850;
        background-color: rgb(255, 255, 255);

        opacity: 0.75;
    }

    .hack-window:hover {
        opacity: 0.9;
    }

    .my-header-container {
        font-weight: 800;
        font-size: 22px;
        height: 52px;
        text-align: center;
        vertical-align: middle;
        line-height: 52px;
        color: rgb(35, 35, 35);
        text-transform: uppercase;
        background: rgb(244, 244, 244);
        border-bottom: 2px solid rgb(35, 35, 35);
        border-top-left-radius: 19px;
        border-top-right-radius: 19px;
        box-shadow: rgb(174 174 174) 0px -5px 0px inset;
        letter-spacing: 2px;
        position: relative;
    }

    .my-header-text {
        max-height: 51px;
        padding: 0px 15px;
        text-align: center;
        overflow: hidden;
        font-size: 22px;
    }

    .my-hidden {
        display: none;
    }

    .my-checkbox-container {
        display: block;
        position: relative;
        padding-left: 45px;
        margin: 18px auto 9px;
        cursor: pointer;
        user-select: none;
        font-family: "Avenir Next", sans-serif;
        font-size: 13px;
        line-height: 17px;
        letter-spacing: 0.433333px;
        color: rgb(165, 165, 165);
    }

    .my-checkbox-text {
        font-size: 15px;
        letter-spacing: 0.5px;
        color: rgb(153, 153, 153);
    }

    .my-checkbox-input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0px;
        width: 0px;
    }

    .my-checkbox-checkmark {
        position: absolute;
        top: -5px;
        left: 0px;
        height: 20px;
        width: 20px;
        border: 2px solid rgb(35, 35, 35);
        box-shadow: rgb(0 0 0 / 50%) 0px -1px 5px;
        border-radius: 6px;
        background: rgb(255, 255, 255);
    }

    .my-form {
        padding: 0px 13px;
        display: flex;
        flex-direction: column;
        max-width: 400px;
        font-family: "Avenir Next", sans-serif;
        font-size: 16px;
        line-height: 26px;
        color: rgb(153, 153, 153);
        height: 100%;
    }

    .my-checked {
        background-color: #189ad3;
    }
  `;
  document.getElementsByTagName("head")[0].appendChild(style);
};

/*
    updates all created markers
*/
const updateMarkers = async () => {
  for (let key in hackState.markers) {
    const marker = hackState.markers[key];
    marker.update();
  }
  return Promise.resolve();
};

createStylesheet();

/*
    begin hack processing

    we begin processing after 5 seconds so that the game's code is initialized first
    and the global variables we need are injected into the window object
*/
setTimeout(() => {
  /*
    collect references to dependencies 
  */

  hackState.rootElement = document.querySelector("#root");
  hackState.mapContainer = document.querySelector(".mapboxgl-canvas-container");

  /*
    the map references is injected into window by our injected code
  */
  hackState.map = window.__map;

  const eventElement = document.createElement("div");
  eventElement.style = "display: hidden";

  /*
    set up events
  */
  hackState.eventElement = eventElement;
  hackState.renderEvent = new Event("__render");

  /*
    the render event is invoked by our hook installed in the game code
  */
  eventElement.addEventListener("__render", () => {
    if (hackState.isEnabled) {
      updateMarkers();
    }
  });

  /*
    creates the hack gui
  */
  hackState.hackGui = new HackGui();

  console.log("hackState:", hackState);

  /*
    begin creating markers
  */
  setInterval(() => {
    if (hackState.isEnabled) {
      if (hackState.map && hackState.mapContainer) {
        /*
              properties are injected
            */
        hackState.properties = window.__properties;

        if (hackState.properties) {
          //console.log("properties:", properties);

          /*
                  clean up markers not in range anymore
              */
          for (let key in hackState.markers) {
            if (!hackState.properties[key]) {
              const marker = hackState.markers[key];
              marker.element.remove();
              delete hackState.markers[key];
            }
          }

          /*
                  iterate over properties and begin creating markers
              */
          for (let key in hackState.properties) {
            const property = hackState.properties[key];
            if (property) {
              if (!hackState.markers[property.prop_id]) {
                const marker = new Marker({
                  propertyId: property.prop_id,
                  map: hackState.map,
                  mapContainer: hackState.mapContainer,
                  lat: property.centerlat,
                  lng: property.centerlng,
                });
                hackState.markers[property.prop_id] = marker;
                //   console.log("Created marker for property", property.prop_id);
              }
            }
          }

          //   updateMarkersVisibility();
        }
      }
    }
  }, 1000);
}, 5000);
