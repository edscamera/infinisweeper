import { initializeApp } from "http://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import { getDatabase } from "http://www.gstatic.com/firebasejs/9.8.1/firebase-database.js";
const firebaseConfig = {
    apiKey: "AIzaSyD1vGYCL-rOxFggOBTKjzPlu7I2nB5MBJ4",
    authDomain: "edwardscamera-infinisweeper.firebaseapp.com",
    databaseURL: "https://edwardscamera-infinisweeper-default-rtdb.firebaseio.com",
    projectId: "edwardscamera-infinisweeper",
    storageBucket: "edwardscamera-infinisweeper.appspot.com",
    messagingSenderId: "972437577186",
    appId: "1:972437577186:web:4e63ba304ccb223b9a2dbb",
    measurementId: "G-LZPD1CY2HM"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };