// Create Option elements in range of two numbers
const addYears = (start, end) => {
    const yearList = [...Array(end - start + 1).keys()].map(
        (x) => x + start
    );
    let listOptionHTML = "";
    const listOptions = yearList.reverse().forEach((el) => {
        listOptionHTML += `<option value="${el}">${el}</option>`;
    });
    document
        .getElementById("year")
        .insertAdjacentHTML("afterbegin", listOptionHTML);
};
// Define filter Object for filtering Data from CSV files
// Set an initial value for first loading
const monthOfQuarter = (quarter) => {
    switch (quarter) {
        case "q1":
            return ["Jan", "Feb", "Mar"];
        case "q2":
            return ["Apr", "May", "Jun"];
        case "q3":
            return ["Jul", "Aug", "Sep"];
        case "q4":
            return ["Oct", "Nov", "Dec"];
        default:
            return ["Jan", "Feb", "Mar"];
    }
}
const filters = {
    Year: "2022",
    Quarter: monthOfQuarter("q1"),
    Colors: ["#36EEE0", "#F652A0", "#4C5270"],
    Chart : "barChart",
};


// Define update filter function
const updateFilter = () => {
    filters.Year = document.getElementById("year").value;
    document.getElementsByName("quarter").forEach((el) => {
        if (el.checked) filters.Quarter = monthOfQuarter(el.value);
    });
};

// Define all header columns of CSV files
const dataColumn = ["Region", "Year", "Jan", "Feb", "Mar", "Apr", "May",
    "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Define data filter function
const dataFilter = (row) => {
    return dataColumn.reduce((pass, column) => {
        return (
            pass &&
            // pass if no filter is set
            (!filters[column] ||
                // pass if the row's value is equal to the filter
                // (i.e. the filter is set to a string)
                row[column] === filters[column] ||
                // pass if the row's value is in an array of filter values
                filters[column].indexOf(row[column]) >= 0)
        );
    }, true);
};

// Add event listener for changing value of year in select option
document.getElementById("year").addEventListener("change", () => {
    updateFilter();
    updateGraph();
});

// Add event listener for changing value of radio button in radio option (change the quarter)
document.getElementById("quarter").addEventListener("click", () => {
    updateFilter();
    updateGraph();
});

document.getElementById("typechart").addEventListener("change",()=>{
    updateGraph();
});

//Add Years to DOM after page loading
document.addEventListener("DOMContentLoaded", () => {
    addYears(1975, 2022);
    updateGraph();
});


// Upadte Graph
const updateGraph = ()=>{
    document.getElementsByName("typechart").forEach((el) => {
        if (el.checked) filters.Chart = el.value;
    });
    document.getElementById("d3id").textContent = "";
    filters.Chart == "barChart" ? drawChart(filters) : drawMap(filters);
}


// Draw chart with D3 library
const drawChart = (filters) => {
    document.getElementById("d3id").innerHTML = "";
    const models = [];
    Promise.all([d3.dsv(",", "/assets/data/data.csv")]).then((data) => {
        const MyData = data[0].filter((row) => dataFilter(row));
        MyData.filter((x) => x.Year == filters.Year).forEach((el) => {
            models.push({
                Region: el.Region,
                M1: el[filters.Quarter[0]] * 1,
                M2: el[filters.Quarter[1]] * 1,
                M3: el[filters.Quarter[2]] * 1,
            });
        });

        // Define chart parameters
        const container = d3.select("#d3id"),
            width = 1200,
            height = 600,
            margin = { top: 40, right: 20, bottom: 80, left: 50 },
            barPadding = 0.2,
            axisTicks = { qty: 5, outerSize: 0, dateFormat: "%m-%d" };

        const svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale0 = d3
            .scaleBand()
            .range([0, width - margin.left - margin.right])
            .padding(barPadding);
        const xScale1 = d3.scaleBand();
        const yScale = d3
            .scaleLinear()
            .range([height - margin.top - margin.bottom, 0]);

        const xAxis = d3
            .axisBottom(xScale0)
            .tickSizeOuter(axisTicks.outerSize);
        const yAxis = d3
            .axisLeft(yScale)
            .ticks(axisTicks.qty)
            .tickSizeOuter(axisTicks.outerSize);

        xScale0.domain(
            models.map((d) => (d.Region))
        );
        xScale1.domain(["M1", "M2", "M3"]).range([0, xScale0.bandwidth()]);
        yScale.domain([
            0,
            d3.max(models, (d) => {
                if (d.M1 >= d.M2 && d.M1 >= d.M3) {
                    return d.M1;
                } else if (d.M2 >= d.M1 && d.M2 >= d.M3) {
                    return d.M2;
                } else {
                    return d.M3;
                }
            }),
        ]);
        const Region = svg
            .selectAll(".Region")
            .data(models)
            .enter()
            .append("g")
            .attr("class", "Region")
            .attr(
                "transform", (d) => `translate(${xScale0(d.Region)},0)`
            );

        /* Add first month bars */
        Region.selectAll(".bar.M1")
            .data((d) => [d])
            .enter()
            .append("rect")
            .attr("class", "bar M1")
            .style("fill", filters.Colors[0])
            .attr("x", (d) => xScale1("M1"))
            .attr("y", (d) => yScale(d.M1))
            .attr("width", xScale1.bandwidth())
            .attr("height", (d) => {
                return height - margin.top - margin.bottom - yScale(d.M1);
            });

        /* Add second bars */
        Region.selectAll(".bar.M2")
            .data((d) => [d])
            .enter()
            .append("rect")
            .attr("class", "bar M2")
            .style("fill", filters.Colors[1])
            .attr("x", (d) => xScale1("M2"))
            .attr("y", (d) => yScale(d.M2))
            .attr("width", xScale1.bandwidth())
            .attr("height", (d) => {
                return height - margin.top - margin.bottom - yScale(d.M2);
            });

        Region.selectAll(".bar.M3")
            .data((d) => [d])
            .enter()
            .append("rect")
            .attr("class", "bar M3")
            .style("fill", filters.Colors[2])
            .attr("x", (d) => xScale1("M3"))
            .attr("y", (d) => yScale(d.M3))
            .attr("width", xScale1.bandwidth())
            .attr("height", (d) => {
                return height - margin.top - margin.bottom - yScale(d.M3);
            });
        // Add the X Axis
        svg
            .append("g")
            .attr("class", "x axis")
            .attr(
                "transform",
                `translate(0,${height - margin.top - margin.bottom})`
            )
            .call(xAxis);

        svg.selectAll("text")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start");
        // text label for the X axis
        svg
            .append("text")
            .attr(
                "transform",
                `translate(${width / 2}  , ${height - margin.bottom + 30})`
            )
            .style("text-anchor", "middle")
            .text("Region");

        // Add the Y Axis
        svg.append("g").attr("class", "y axis").call(yAxis);

        // text lable for the Y axis
        svg
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Value");

        // Create Legend
        const xLegend = 0;
        svg
            .append("circle")
            .attr("cx", xLegend - 30)
            .attr("cy", height - margin.bottom - 10)
            .attr("r", 6)
            .style("fill", filters.Colors[0])
            .style("stroke", "black");
        svg
            .append("circle")
            .attr("cx", xLegend - 30)
            .attr("cy", height - margin.bottom + 10)
            .attr("r", 6)
            .style("fill", filters.Colors[1])
            .style("stroke", "black");
        svg
            .append("circle")
            .attr("cx", xLegend - 30)
            .attr("cy", height - margin.bottom + 30)
            .attr("r", 6)
            .style("fill", filters.Colors[2])
            .style("stroke", "black");
        svg
            .append("text")
            .attr("x", xLegend - 10)
            .attr("y", height - margin.bottom - 10)
            .text(filters.Quarter[0])
            .style("fill", filters.Colors[0])
            .style("font-size", "15px")
            .attr("alignment-baseline", "middle");
        svg
            .append("text")
            .attr("x", xLegend - 10)
            .attr("y", height - margin.bottom + 10)
            .text(filters.Quarter[1])
            .style("fill", filters.Colors[1])
            .style("font-size", "15px")
            .attr("alignment-baseline", "middle");
        svg
            .append("text")
            .attr("x", xLegend - 10)
            .attr("y", height - margin.bottom + 30)
            .text(filters.Quarter[2])
            .style("fill", filters.Colors[2])
            .style("font-size", "15px")
            .attr("alignment-baseline", "middle");
    });
};
//drawChart(filters);

const drawMap = (filters) => {
    document.getElementById("d3id").innerHTML = "";
    const models = [];
    Promise.all([d3.dsv(",", "/assets/data/data.csv")]).then((data) => {
        const MyData = data[0].filter((row) => dataFilter(row));
        MyData.filter((x) => x.Year == filters.Year).forEach((el) => {
            models.push({
                Region: el.Region,
                M1: el[filters.Quarter[0]] * 1,
                M2: el[filters.Quarter[1]] * 1,
                M3: el[filters.Quarter[2]] * 1,
            });
        });
        // set width and height of svg
        const width = 1200
        const height = 600

        // The svg
        const svg = d3.select("#d3id")
            .append("svg")
            .attr("width", width)
            .attr("height", height)

        // Map and projection
        const projection = d3.geoMercator()
            .center([9, 47])                // GPS of location to zoom on
            .scale(8160)                       // This is like the zoom
            .translate([width / 2, height / 2])

        // Create data for circles:
        const markers = [
            { long: 7.395, lat: 47.148, name: "Région lémanique" },
            { long: 6.657, lat: 46.587, name: "Vaud" },
            { long: 7.064, lat: 46.256, name: "Valais" },
            { long: 6.109, lat: 46.205, name: "Genève" },
            { long: 7.414, lat: 46.923, name: "Espace Mittelland" },
            { long: 6.090, lat: 46.225, name: "Berne" },
            { long: 7.125, lat: 46.803, name: "Fribourg" },
            { long: 7.513, lat: 47.208, name: "Soleure" },
            { long: 6.873, lat: 46.995, name: "Neuchâtel" },
            { long: 6.919, lat: 47.328, name: "Jura" },
            { long: 7.554, lat: 47.560, name: "Suisse du Nord-Ouest" },
            { long: 7.554, lat: 47.560, name: "Bâle-Ville" },
            { long: 7.363, lat: 47.451, name: "Bâle-Campagne" },
            { long: 7.804, lat: 47.379, name: "Argovie" },
            { long: 8.467, lat: 47.378, name: "Zurich" },
            { long: 9.280, lat: 47.304, name: "Suisse orientale" },
            { long: 8.915, lat: 47.013, name: "Glaris" },
            { long: 8.611, lat: 47.715, name: "Schaffhouse" },
            { long: 9.271, lat: 47.358, name: "Appenzell Rh.-Ext." },
            { long: 9.324, lat: 47.337, name: "Appenzell Rh.-Int." },
            { long: 9.293, lat: 47.424, name: "Saint-Gall" },
            { long: 9.011, lat: 46.617, name: "Grisons" },
            { long: 8.792, lat: 47.536, name: "Thurgovie" },
            { long: 7.860, lat: 46.907, name: "Suisse centrale" },
            { long: 8.212, lat: 47.055, name: "Lucerne" },
            { long: 8.397, lat: 46.761, name: "Uri" },
            { long: 8.621, lat: 47.026, name: "Schwytz" },
            { long: 8.134, lat: 46.867, name: "Obwald" },
            { long: 8.256, lat: 46.896, name: "Nidwald" },
            { long: 8.446, lat: 47.152, name: "Zoug" },
            { long: 8.211, lat: 46.225, name: "Tessin" },
        ];
        //const markers = models;
        markers.forEach((el, index) => {
            el[filters.Quarter[0]] = models[index].M1;
            el[filters.Quarter[1]] = models[index].M2;
            el[filters.Quarter[2]] = models[index].M3;
        });
    
        // Load external data and boot
        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(function (data) {

            // Filter data
            data.features = data.features.filter(d => d.properties.name == "Switzerland")

            // Draw the map
            svg.append("g")
                .selectAll("path")
                .data(data.features)
                .join("path")
                .attr("fill", "#b8b8b8")
                .attr("d", d3.geoPath()
                    .projection(projection)
                )
                .style("stroke", "black")
                .style("opacity", .3)

            // create a tooltip
            const Tooltip = d3.select("#d3id")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 1)
                .style("background-color", "white")
                .style("border", "solid")
                .style("border-width", "2px")
                .style("border-radius", "5px")
                .style("padding", "5px")

            // change the tooltip when user hover / move / leave a cell
            const mouseover = (event, d) => {
                Tooltip.style("opacity", 1)
            }
            const mousemove = (event, d) => {
                Tooltip
                    .html(`${d.name}<br>
                            ${filters.Quarter[0]}: ${d[filters.Quarter[0]].toFixed(3)}<br>
                            ${filters.Quarter[1]}: ${d[filters.Quarter[1]].toFixed(3)}<br>
                            ${filters.Quarter[2]}: ${d[filters.Quarter[2]].toFixed(3)}`)
                    .style("left", (event.x) + "px")
                    .style("top", (event.y) - 30 + "px")
                    .style("width", "90px");
            }
            const mouseleave = (event, d) => {
                Tooltip.style("opacity", 0)
            }

            // Add circles:
            svg
                .selectAll("myCircles")
                .data(markers)
                .join("circle")
                .attr("cx", d => projection([d.long, d.lat])[0])
                .attr("cy", d => projection([d.long, d.lat])[1])
                .attr("r", 5)
                .attr("class", "circle")
                .style("fill", filters.Colors[1])
                .attr("stroke",filters.Colors[2] )
                .attr("stroke-width", 3)
                .attr("fill-opacity", .4)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)

        });
    });
}