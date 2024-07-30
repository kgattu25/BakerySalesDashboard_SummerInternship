$(document).ready(function () {
    const jsonFilePath = 'data.json';
    $.getJSON(jsonFilePath, function (data) {
        const transactions = data.bakerySales;
        const totalTransactions = transactions.length;
        $('#totalOrders').html(totalTransactions);

        const itemCount = {};
        transactions.forEach(transaction => {
            transaction.Items.forEach(item => {
                if (itemCount[item]) {
                    itemCount[item]++;
                } else {
                    itemCount[item] = 1;
                }
            });
        });

        let mostlyOrderedItem = '';
        let mostlyOrderedCount = 0;
        for (const [item, count] of Object.entries(itemCount)) {
            if (count > mostlyOrderedCount) {
                mostlyOrderedItem = item;
                mostlyOrderedCount = count;
            }
        }
        $('#mostlyOrdered').html(mostlyOrderedItem);

        const daypartCount = { "Morning": 0, "Afternoon": 0, "Evening": 0 };
        transactions.forEach(transaction => {
            daypartCount[transaction.Daypart]++;
        });

        let busiestTime = 'None';
        let busyCount = 0;
        for (const [daypart, count] of Object.entries(daypartCount)) {
            if (count > busyCount) {
                busiestTime = daypart;
                busyCount = count;
            }
        }

        let noCrowd = 'None';
        let crowdCount = busyCount;
        for (const [daypart, count] of Object.entries(daypartCount)) {
            if (count < busyCount) {
                noCrowd = daypart;
                crowdCount = count;
            }
        }
        $('#busiestOn').html(busiestTime + 's');
        $('#fasterQueues').html(noCrowd + 's');

        const itemStats = {};
        transactions.forEach(transaction => {
            transaction.Items.forEach(item => {
                if (!itemStats[item]) {
                    itemStats[item] = { count: 0, daypartCount: { "Morning": 0, "Afternoon": 0, "Evening": 0 }, daytypeCount: { "Weekday": 0, "Weekend": 0 } };
                }
                itemStats[item].count++;
                itemStats[item].daypartCount[transaction.Daypart]++;
                itemStats[item].daytypeCount[transaction.DayType]++;
            });
        });

        for (const item in itemStats) {
            if (itemStats.hasOwnProperty(item)) {
                let maxDaypartCount = 0;
                let mostOrderedDaypart = 'None';
                for (const [daypart, count] of Object.entries(itemStats[item].daypartCount)) {
                    if (count > maxDaypartCount) {
                        maxDaypartCount = count;
                        mostOrderedDaypart = daypart;
                    }
                }
                itemStats[item].mostOrderedDaypart = mostOrderedDaypart;

                let maxDaytypeCount = 0;
                let mostOrderedDaytype = 'None';
                for (const [daytype, count] of Object.entries(itemStats[item].daytypeCount)) {
                    if (count > maxDaytypeCount) {
                        maxDaytypeCount = count;
                        mostOrderedDaytype = daytype;
                    }
                }
                itemStats[item].mostOrderedDaytype = mostOrderedDaytype;
            }
        }

        const itemArray = [];
        for (const item in itemStats) {
            if (itemStats.hasOwnProperty(item)) {
                itemArray.push([item, itemStats[item]]);
            }
        }

        itemArray.sort((a, b) => b[1].count - a[1].count);

        const top8Items = itemArray.slice(0, 8);

        let tableHtml = '<table class="table table-responsive-lg"><thead><tr><th>Item</th><th>Count</th><th>DayPart</th><th>DayType</th></tr></thead><tbody>';
        top8Items.forEach(([item, stats]) => {
            tableHtml += `<tr><td>${item}</td><td>${stats.count}</td><td>${stats.mostOrderedDaypart}</td><td>${stats.mostOrderedDaytype}</td></tr>`;
        });
        tableHtml += '</tbody></table>';

        $('#top8').html('<div class="header mb-2">Customer Favourites</div>' + tableHtml);

        const weekendSales = { "Morning": 0, "Afternoon": 0, "Evening": 0 };
        transactions.forEach(transaction => {
            if (transaction.DayType === "Weekend") {
                weekendSales[transaction.Daypart]++;
            }
        });

        const dayPartCount = { "Morning": 0, "Afternoon": 0, "Evening": 0 };
        transactions.forEach(transaction => {
            if (transaction.DayType === "Weekday") {
                dayPartCount[transaction.Daypart]++;
            }
        });

        google.charts.load('current', { packages: ['corechart', 'bar'] });
        google.charts.setOnLoadCallback(drawCharts);

        function drawCharts() {
            drawWeekendSalesChart();
            drawWeekdayChart();
            drawSalesPieCharts();
        }

        function drawWeekendSalesChart() {
            const data = new google.visualization.DataTable();
            data.addColumn('string', 'Daypart');
            data.addColumn('number', 'Sales');

            data.addRows([
                ['Morning', weekendSales["Morning"]],
                ['Afternoon', weekendSales["Afternoon"]],
                ['Evening', weekendSales["Evening"]]
            ]);

            const options = {
                colors: ['#DA70D6'],
                backgroundColor: 'transparent',
                chartArea: { width: '100%' },
                hAxis: { ticks: [] },
                vAxis: { ticks: [] },
                legend: 'none',
                height: 200,
                textStyle: { fontName: 'Noto Sans', fontSize: 12, color: '#333' },
                tooltip: {
                    textStyle: { fontName: 'Noto Sans', fontSize: 12, color: '#000' },
                    showColorCode: true
                },
                annotations: {
                    alwaysOutside: true,
                    textStyle: { fontName: 'Noto Sans', fontSize: 12, color: '#000' }
                },
            };

            const chart = new google.visualization.ColumnChart(document.getElementById('weekend-sales-chart'));
            chart.draw(data, options);
        }

        function drawWeekdayChart() {
            const data = google.visualization.arrayToDataTable([
                ['Daypart', 'Sales'],
                ['Morning', dayPartCount.Morning],
                ['Afternoon', dayPartCount.Afternoon],
                ['Evening', dayPartCount.Evening]
            ]);

            const options = {
                colors: ['#8e44ad'],
                backgroundColor: 'transparent',
                chartArea: { width: '100%' },
                hAxis: { ticks: [] },
                vAxis: { ticks: [] },
                legend: 'none',
                height: 200,
                textStyle: { fontName: 'Noto Sans', fontSize: 14, color: '#333' },
                tooltip: {
                    textStyle: { fontName: 'Noto Sans', fontSize: 12, color: '#000' },
                    showColorCode: true
                },
                annotations: {
                    alwaysOutside: true,
                    textStyle: { fontName: 'Noto Sans', fontSize: 12, color: '#000' }
                },
            };

            const chart = new google.visualization.ColumnChart(document.getElementById('weekday-sales-chart'));
            chart.draw(data, options);
        }

        function drawSalesPieCharts() {
            const morningData = new google.visualization.DataTable();
            morningData.addColumn('string', 'Day Type');
            morningData.addColumn('number', 'Sales Count');

            const noonData = new google.visualization.DataTable();
            noonData.addColumn('string', 'Day Type');
            noonData.addColumn('number', 'Sales Count');

            const eveData = new google.visualization.DataTable();
            eveData.addColumn('string', 'Day Type');
            eveData.addColumn('number', 'Sales Count');

            const morningSales = { "Weekday": 0, "Weekend": 0 };
            const noonSales = { "Weekday": 0, "Weekend": 0 };
            const eveSales = { "Weekday": 0, "Weekend": 0 };

            transactions.forEach(transaction => {
                if (transaction.Daypart === "Morning") {
                    morningSales[transaction.DayType]++;
                }
                if (transaction.Daypart === "Afternoon") {
                    noonSales[transaction.DayType]++;
                }
                if (transaction.Daypart === "Evening") {
                    eveSales[transaction.DayType]++;
                }
            });

            morningData.addRows([
                ['Weekday', morningSales["Weekday"]],
                ['Weekend', morningSales["Weekend"]]
            ]);

            noonData.addRows([
                ['Weekday', noonSales["Weekday"]],
                ['Weekend', noonSales["Weekend"]]
            ]);

            eveData.addRows([
                ['Weekday', eveSales["Weekday"]],
                ['Weekend', eveSales["Weekend"]]
            ]);

            const options = {
                pieHole: 0.5,
                backgroundColor: 'transparent',
                chartArea: { width: '80%', height: '80%', top: '20%' },
                tooltip: {
                    textStyle: { fontName: 'Noto Sans', fontSize: 12, color: '#000' },
                    showColorCode: true
                },
                annotations: {
                    alwaysOutside: true,
                    textStyle: { fontName: 'Noto Sans', fontSize: 12, color: '#000' }
                },
                pieSliceText: 'none',
                legend: 'none',
                height: 230,
                colors: ['#8e44ad', '#DA70D6'],
                titleTextStyle: {
                    fontSize: 16,
                    color: 'darkslategray',
                    fontName: 'Noto Sans',
                },
            };

            const morningChart = new google.visualization.PieChart(document.getElementById('mpiechart'));
            morningChart.draw(morningData, { ...options, title: 'Morning' });

            const noonChart = new google.visualization.PieChart(document.getElementById('apiechart'));
            noonChart.draw(noonData, { ...options, title: 'Afternoon' });

            const eveChart = new google.visualization.PieChart(document.getElementById('epiechart'));
            eveChart.draw(eveData, { ...options, title: 'Evening' });
        }
    });
});
