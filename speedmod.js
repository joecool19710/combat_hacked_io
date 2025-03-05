(function () {
  // --- Register the Service Worker using the separate file ---
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(function (reg) {
        console.log('Service Worker registered:', reg);
      })
      .catch(function (error) {
        console.error('Service Worker registration failed:', error);
      });
  }

  // Wait until the DOM is fully loaded before running the rest
  document.addEventListener('DOMContentLoaded', function () {

    // --- Timer and Speed Modification Script ---
    (function pageScript() {
      let speedConfig = {
        speed: 1.0,
        cbSetIntervalChecked: true,
        cbSetTimeoutChecked: true,
        cbPerformanceNowChecked: true,
        cbDateNowChecked: true,
        cbRequestAnimationFrameChecked: false,
      };

      const emptyFunction = () => {};

      const originalClearInterval = window.clearInterval;
      const originalClearTimeout = window.clearTimeout;

      const originalSetInterval = window.setInterval;
      const originalSetTimeout = window.setTimeout;

      const originalPerformanceNow = window.performance.now.bind(window.performance);
      const originalDateNow = Date.now;
      const originalRequestAnimationFrame = window.requestAnimationFrame;

      let timers = [];
      const reloadTimers = () => {
        console.log(timers);
        const newtimers = [];
        timers.forEach((timer) => {
          originalClearInterval(timer.id);
          if (timer.customTimerId) {
            originalClearInterval(timer.customTimerId);
          }
          if (!timer.finished) {
            const newTimerId = originalSetInterval(
              timer.handler,
              speedConfig.cbSetIntervalChecked ? timer.timeout / speedConfig.speed : timer.timeout,
              ...timer.args
            );
            timer.customTimerId = newTimerId;
            newtimers.push(timer);
          }
        });
        timers = newtimers;
      };

      window.addEventListener("message", (e) => {
        if (e.data.command === "setSpeedConfig") {
          speedConfig = e.data.config;
          reloadTimers();
        }
      });

      // Let other parts of your app know the current speed config if needed.
      window.postMessage({ command: "getSpeedConfig" });

      window.clearInterval = (id) => {
        originalClearInterval(id);
        timers.forEach((timer) => {
          if (timer.id == id) {
            timer.finished = true;
            if (timer.customTimerId) {
              originalClearInterval(timer.customTimerId);
            }
          }
        });
      };

      window.clearTimeout = (id) => {
        originalClearTimeout(id);
        timers.forEach((timer) => {
          if (timer.id == id) {
            timer.finished = true;
            if (timer.customTimerId) {
              originalClearTimeout(timer.customTimerId);
            }
          }
        });
      };

      window.setInterval = (handler, timeout, ...args) => {
        console.log("timeout  ", timeout);
        if (!timeout) timeout = 0;
        const id = originalSetInterval(
          handler,
          speedConfig.cbSetIntervalChecked ? timeout / speedConfig.speed : timeout,
          ...args
        );
        timers.push({
          id: id,
          handler: handler,
          timeout: timeout,
          args: args,
          finished: false,
          customTimerId: null,
        });
        return id;
      };

      window.setTimeout = (handler, timeout, ...args) => {
        if (!timeout) timeout = 0;
        return originalSetTimeout(
          handler,
          speedConfig.cbSetTimeoutChecked ? timeout / speedConfig.speed : timeout,
          ...args
        );
      };

      // Override performance.now
      (function () {
        let performanceNowValue = null;
        let previusPerformanceNowValue = null;
        window.performance.now = () => {
          const originalValue = originalPerformanceNow();
          if (performanceNowValue) {
            performanceNowValue +=
              (originalValue - previusPerformanceNowValue) *
              (speedConfig.cbPerformanceNowChecked ? speedConfig.speed : 1);
          } else {
            performanceNowValue = originalValue;
          }
          previusPerformanceNowValue = originalValue;
          return Math.floor(performanceNowValue);
        };
      })();

      // Override Date.now
      (function () {
        let dateNowValue = null;
        let previusDateNowValue = null;
        Date.now = () => {
          const originalValue = originalDateNow();
          if (dateNowValue) {
            dateNowValue +=
              (originalValue - previusDateNowValue) *
              (speedConfig.cbDateNowChecked ? speedConfig.speed : 1);
          } else {
            dateNowValue = originalValue;
          }
          previusDateNowValue = originalValue;
          return Math.floor(dateNowValue);
        };
      })();

      // Override requestAnimationFrame
      (function () {
        let dateNowValue = null;
        let previusDateNowValue = null;
        const callbackFunctions = [];
        const callbackTick = [];
        const newRequestAnimationFrame = (callback) => {
          return originalRequestAnimationFrame((timestamp) => {
            const originalValue = originalDateNow();
            if (dateNowValue) {
              dateNowValue +=
                (originalValue - previusDateNowValue) *
                (speedConfig.cbRequestAnimationFrameChecked ? speedConfig.speed : 1);
            } else {
              dateNowValue = originalValue;
            }
            previusDateNowValue = originalValue;

            const dateNowValue_MathFloor = Math.floor(dateNowValue);

            const index = callbackFunctions.indexOf(callback);
            let tickFrame = null;
            if (index === -1) {
              callbackFunctions.push(callback);
              callbackTick.push(0);
              callback(dateNowValue_MathFloor);
            } else if (speedConfig.cbRequestAnimationFrameChecked) {
              tickFrame = callbackTick[index];
              tickFrame += speedConfig.speed;
              if (tickFrame >= 1) {
                while (tickFrame >= 1) {
                  callback(dateNowValue_MathFloor);
                  window.requestAnimationFrame = emptyFunction;
                  tickFrame -= 1;
                }
                window.requestAnimationFrame = newRequestAnimationFrame;
              } else {
                window.requestAnimationFrame(callback);
              }
              callbackTick[index] = tickFrame;
            } else {
              callback(dateNowValue_MathFloor);
            }
          });
        };
        window.requestAnimationFrame = newRequestAnimationFrame;
      })();

      // --- Create UI Elements at Runtime ---
      // Container for the controls (top left corner)
      const uiContainer = document.createElement('div');
      uiContainer.style.position = 'fixed';
      uiContainer.style.top = '10px';
      uiContainer.style.left = '10px';
      uiContainer.style.display = 'flex';
      uiContainer.style.alignItems = 'center';
      uiContainer.style.backgroundColor = 'black';
      uiContainer.style.padding = '5px';
      uiContainer.style.borderRadius = '5px';
      uiContainer.style.zIndex = '9999';

      // Left button ("<")
      const btnDecrease = document.createElement('button');
      btnDecrease.textContent = '<';
      btnDecrease.style.backgroundColor = 'orange';
      btnDecrease.style.color = 'black';
      btnDecrease.style.border = 'none';
      btnDecrease.style.padding = '5px 10px';
      btnDecrease.style.cursor = 'pointer';
      btnDecrease.style.fontSize = '16px';

      // Middle display: current speed
      const speedDisplay = document.createElement('div');
      speedDisplay.textContent = speedConfig.speed.toFixed(1);
      speedDisplay.style.backgroundColor = 'orange';
      speedDisplay.style.color = 'black';
      speedDisplay.style.padding = '5px 10px';
      speedDisplay.style.fontSize = '16px';
      speedDisplay.style.textAlign = 'center';

      // Right button (">")
      const btnIncrease = document.createElement('button');
      btnIncrease.textContent = '>';
      btnIncrease.style.backgroundColor = 'orange';
      btnIncrease.style.color = 'black';
      btnIncrease.style.border = 'none';
      btnIncrease.style.padding = '5px 10px';
      btnIncrease.style.cursor = 'pointer';
      btnIncrease.style.fontSize = '16px';

      // Append the elements into the container
      uiContainer.appendChild(btnDecrease);
      uiContainer.appendChild(speedDisplay);
      uiContainer.appendChild(btnIncrease);
      document.body.appendChild(uiContainer);

      // --- Button Event Listeners ---
      btnDecrease.addEventListener('click', () => {
        // Decrease speed (minimum speed: 0.1)
        speedConfig.speed = Math.max(0.1, speedConfig.speed - 0.1);
        speedDisplay.textContent = speedConfig.speed.toFixed(1);
        // Broadcast the new config
        window.postMessage({ command: 'setSpeedConfig', config: speedConfig });
      });

      btnIncrease.addEventListener('click', () => {
        // Increase speed
        speedConfig.speed = speedConfig.speed + 0.1;
        speedDisplay.textContent = speedConfig.speed.toFixed(1);
        // Broadcast the new config
        window.postMessage({ command: 'setSpeedConfig', config: speedConfig });
      });
    })();
  }); // End of DOMContentLoaded
})();
