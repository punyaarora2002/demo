document.getElementById('calculatorForm').addEventListener('submit', function(event) {
    event.preventDefault();

    let solarCapacity = parseFloat(document.getElementById('solarCapacity').value);
    let noOfDays = parseFloat(document.getElementById('noOfDays').value);
    let temperatureCoefficient = parseFloat(document.getElementById('temperatureCoefficient').value) / 100;
    let shadowLossPercentage = parseFloat(document.getElementById('shadowLossPercentage').value) / 100;
    let place = document.getElementById('place').value;
    let startTime = new Date(document.getElementById('startTime').value);
    let endTime = new Date(document.getElementById('endTime').value);
    let noOfYears = parseFloat(document.getElementById('noOfYears').value);
    let csvFile = document.getElementById('csvFile').files[0];

    if (!csvFile) {
        alert('Please upload the Dataset1.csv file.');
        return;
    }

    let reader = new FileReader();
    reader.onload = function(event) {
        let csvData = event.target.result;
        Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                let filteredData = results.data.filter(row => {
                    let rowDate = new Date(row.Time);
                    return row.Place === place && rowDate >= startTime && rowDate <= endTime;
                });

                if (filteredData.length === 0) {
                    document.getElementById('results').innerHTML = 'No data available for the specified place and time range.';
                    return;
                }

                let energyYield = filteredData.reduce((sum, row) => sum + parseFloat(row.energy_yield), 0);

                let temperatureData = getTemperatureData(startTime, endTime);
                let dailyTemperature = temperatureData.length ? averageTemperature(temperatureData) : parseFloat(prompt("Enter daily temperature (in degree Celsius):"));

                let NOCT = 45;
                let fixedDeratingFactor = 0.83;

                let cellCoefficient = dailyTemperature + NOCT - 20;
                let temperatureDeratingFactor = 1 - (temperatureCoefficient * (cellCoefficient - 25));
                let shadowDeratingFactor = 1 - shadowLossPercentage;

                let degradationFactor;
                if (noOfYears <= 1) {
                    degradationFactor = 1;
                } else if (noOfYears <= 2) {
                    degradationFactor = 1 - (0.03 * (noOfYears - 1));
                } else {
                    degradationFactor = 1 - (0.0065 * (noOfYears - 2));
                }

                let totalDeratingFactor = temperatureDeratingFactor * shadowDeratingFactor * fixedDeratingFactor * degradationFactor;

                let ghi = energyYield / (solarCapacity * noOfDays * totalDeratingFactor);
                let specificYield = (energyYield / solarCapacity) / 30;

                document.getElementById('results').innerHTML = `
                    GHI is: ${ghi.toFixed(2)} kWh/m2/day<br>
                    Specific yield is: ${specificYield.toFixed(2)}
                `;
            }
        });
    };

    reader.readAsText(csvFile);
});

function getTemperatureData(startTime, endTime) {
    // Sample temperature data based on the given time range
    // Replace this with actual logic to fetch temperature data
    return [25, 26, 27, 28, 29, 30];
}

function averageTemperature(temperatures) {
    let sum = temperatures.reduce((a, b) => a + b, 0);
    return sum / temperatures.length;
}
