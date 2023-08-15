"use strict";

// prettier-ignore

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
let cross;
let months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
let days = ["mon", "tue", "wed", "thurs", "fri", "sat", "sun"];
class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-27);
  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    console.log(this.date);
    this.description = `${this.name[0].toUpperCase()}${this.name.slice(1)} 0n ${
      days[this.date.getDay() - 1]
    }  ${this.date.getDate()} ${
      months[this.date.getMonth()]
    }, ${this.date.getHours()}:${this.date.getMinutes()}${
      this.date.getHours() < 12 ? "AM" : "PM"
    }`;
  }
}

class Running extends Workout {
  name = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._calcPace();
    this._setDescription();
  }
  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  name = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this._calcSpeed();
    this._setDescription(this);
  }
  _calcSpeed() {
    //km / hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////////////////////////////////////////////
//APP ARCHITECTURE
class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();
    //get data from local storage
    this._getlocationStorage();
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
    containerWorkouts.addEventListener("click", this._removeWorkout.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("error");
        }
      );
    }
  }

  _renderWorkout(workout) {
    let html = `
     <li class="workout workout--${workout.name}" data-id='${workout.id}'>
   <div class='box'> <h2 class="workout__title">${workout.description}</h2>
    <span class='cross'>&times;</span></div>

    <div class="workout__details">
      <span class="workout__icon">${
        workout.name === "running" ? "🏃‍♂️" : "🚲"
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
`;
    if (workout.name === "running") {
      html += `<div class="workout__details">
  <span class="workout__icon">⚡️</span>
  <span class="workout__value">${workout.pace.toFixed(1)}</span>
  <span class="workout__unit">min/km</span>
</div>
<div class="workout__details">
  <span class="workout__icon">🦶🏼</span>
  <span class="workout__value">${workout.cadence.toFixed(1)}</span>
  <span class="workout__unit">spm</span>
</div>`;
    }
    if (workout.name === "cycling") {
      html += `<div class="workout__details">
  <span class="workout__icon">⚡️</span>
  <span class="workout__value">${workout.speed.toFixed(1)}</span>
  <span class="workout__unit">km/h</span>
</div>
<div class="workout__details">
  <span class="workout__icon">⛰</span>
  <span class="workout__value">${workout.elevationGain}</span>
  <span class="workout__unit">m</span>
</div>  
  `;
    }
    form.insertAdjacentHTML("afterend", html);
    cross = document.querySelector(".cross");
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));
    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
      this._mark(work, work.name);
    });
  }

  _showForm(Event) {
    this.#mapEvent = Event;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _removeWorkout(e) {
    this.#workouts;
    const workoutEL = e.target.matches(".cross");
    console.log(this.#workouts);
    const workout = this.#workouts.find(
      work => work.id === workoutEL.dataset.id
    );
   // console.log(workout)

    this.#workouts.splice(this.#workouts.indexOf(workout),1)
    console.log(this.#workouts)
    workoutEL.remove()
  }
  _hideForm() {
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        null;
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => {
      form.style.display = "grid";
    }, 1000);
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _moveToPopup(e) {
    const workoutEL = e.target.closest(".workout");
    if (!workoutEL) return;
    const workout = this.#workouts.find(
      (work) => work.id === workoutEL.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  _mark(workout, type) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${type}-popup`,
        })
      )
      .setPopupContent(
        `${
          type === "running" ? "🏃‍♂️" : "🚲"
        } ${type[0].toUpperCase()}${type.slice(1)} on ${
          months[new Date().getMonth()]
        }  ${new Date().getDate()}`
      )
      .openPopup();
  }

  _newWorkout(e) {
    function validInput(...inputs) {
      let b = inputs.every((inp) => Number.isFinite(inp));
      return b;
    }

    function allPositive(...inputs) {
      return inputs.every((inp) => inp > 0);
    }

    e.preventDefault();

    //get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //if activity running,create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      //check if the data is valid
      if (
        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert("inputs have to be postive numbers");
      }
      workout = new Running([lat, lng], distance, duration, cadence);
      this.#workouts.push(workout);
      this._renderWorkout(workout);
      this._mark(workout, workout.name);
      this._hideForm();
      this._setLocalStorage();
    }
    //if activity cycling create cyling object
    if (type === "cycling") {
      //check if the data is valid
      const elevation = +inputElevation.value;
      if (
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert("inputs have to be postive numbers");
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
      this.#workouts.push(workout);
      this._mark(workout, workout.name);
      this._renderWorkout(workout);
      this._hideForm();
      this._setLocalStorage();
    }


    inputDistance.focus();

    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        null;
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  _getlocationStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;
    this.#workouts = data;
  }
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

const app = new App();
