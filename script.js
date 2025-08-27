document.addEventListener('DOMContentLoaded', async () => {
    const stateFlags = [
        'Alabama.png', 'Alaska.png', 'Arizona.png', 'Arkansas.png', 'California.png',
        'Colorado.png', 'Connecticut.png', 'Delaware.png', 'Florida.png', 'Georgia.png',
        'Hawaii.png', 'Idaho.png', 'Illinois.png', 'Indiana.png', 'Iowa.png', 'Kansas.png',
        'Kentucky.png', 'Louisiana.png', 'Maine.png', 'Maryland.png', 'Massachusetts.png',
        'Michigan.png', 'Minnesota.png', 'Mississippi.png', 'Missouri.png', 'Montana.png',
        'Nebraska.png', 'Nevada.png', 'New_Hampshire.png', 'New_Jersey.png', 'New_Mexico.png',
        'New_York.png', 'North_Carolina.png', 'North_Dakota.png', 'Ohio.png', 'Oklahoma.png',
        'Oregon.png', 'Pennsylvania.png', 'Rhode_Island.png', 'South_Carolina.png',
        'South_Dakota.png', 'Tennessee.png', 'Texas.png', 'Utah.png', 'Vermont.png',
        'Virginia.png', 'Washington.png', 'West_Virginia.png', 'Wisconsin.png', 'Wyoming.png'
    ];

    const imageDir = 'state_flags_png/';
    const thumbDir = 'state_flags_thumbnails/';

    async function getAverageColor(imgUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imgUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                let r = 0, g = 0, b = 0;

                for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                }

                const pixelCount = data.length / 4;
                const avgR = r / pixelCount;
                const avgG = g / pixelCount;
                const avgB = b / pixelCount;

                resolve({
                    r: avgR / 255,
                    g: avgG / 255,
                    b: avgB / 255,
                    rgbString: `rgb(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)})`
                });
            };
            img.onerror = reject;
        });
    }

    const stateData = [];
    for (const flag of stateFlags) {
        const stateName = flag.replace('.png', '').replace(/_/g, ' ');
        const colorData = await getAverageColor(imageDir + flag);
        stateData.push({
            name: stateName,
            color: [colorData.r, colorData.g, colorData.b],
            rgbString: colorData.rgbString,
            thumbnail: thumbDir + flag
        });
    }

    function distance(a, b) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2));
    }

    function runKMeans() {
        const K = 4;
        // Generate random initial centroids independent of data points
        let centroids = Array.from({ length: K }, () => [
            Math.random(),
            Math.random(),
            Math.random()
        ]);
        let clusters = [];

        for (let iter = 0; iter < 20; iter++) {
            // Assign clusters
            clusters = Array.from({ length: K }, () => []);
            stateData.forEach((state, i) => {
                let minDist = Infinity;
                let clusterIndex = 0;
                centroids.forEach((centroid, j) => {
                    const dist = distance(state.color, centroid);
                    if (dist < minDist) {
                        minDist = dist;
                        clusterIndex = j;
                    }
                });
                if (!clusters[clusterIndex]) clusters[clusterIndex] = [];
                clusters[clusterIndex].push(i);
            });

            // Update centroids
            centroids = clusters.map(cluster => {
                if (cluster.length === 0) return [Math.random(), Math.random(), Math.random()];
                const newCentroid = [0, 0, 0];
                cluster.forEach(stateIndex => {
                    newCentroid[0] += stateData[stateIndex].color[0];
                    newCentroid[1] += stateData[stateIndex].color[1];
                    newCentroid[2] += stateData[stateIndex].color[2];
                });
                return newCentroid.map(v => v / cluster.length);
            });
        }

        stateData.forEach((state, i) => {
            let clusterIndex = 0;
            let minDist = Infinity;
            centroids.forEach((centroid, j) => {
                const dist = distance(state.color, centroid);
                if (dist < minDist) {
                    minDist = dist;
                    clusterIndex = j;
                }
            });
            state.cluster = clusterIndex;
        });

        return { clusters, centroids };
    }

    function updateVisualization(result) {
        const { clusters, centroids } = result;

        // Plotting
        const plotData = [];

        // Add lines connecting centroids to points
        clusters.forEach((cluster, i) => {
            const centroid = centroids[i];
            const points = cluster.map(stateIndex => stateData[stateIndex]);
            
            points.forEach(point => {
                plotData.push({
                    x: [centroid[0], point.color[0]],
                    y: [centroid[1], point.color[1]],
                    z: [centroid[2], point.color[2]],
                    mode: 'lines',
                    type: 'scatter3d',
                    line: {
                        color: `rgb(${Math.round(point.color[0] * 255)}, ${Math.round(point.color[1] * 255)}, ${Math.round(point.color[2] * 255)})`,
                        width: 2,
                        opacity: 0.6
                    },
                    showlegend: false,
                    hoverinfo: 'skip'
                });
            });
        });

        // Add data points
        clusters.forEach((cluster, i) => {
            const points = cluster.map(stateIndex => stateData[stateIndex]);
            plotData.push({
                x: points.map(p => p.color[0]),
                y: points.map(p => p.color[1]),
                z: points.map(p => p.color[2]),
                mode: 'markers',
                type: 'scatter3d',
                name: `Cluster ${i + 1}`,
                text: points.map(p => p.name),
                marker: {
                    size: 8,
                    color: points.map(p => `rgb(${Math.round(p.color[0] * 255)}, ${Math.round(p.color[1] * 255)}, ${Math.round(p.color[2] * 255)})`),
                    opacity: 0.8
                }
            });
        });

        // Add centroids
        const centroidTrace = {
            x: centroids.map(c => c[0]),
            y: centroids.map(c => c[1]),
            z: centroids.map(c => c[2]),
            mode: 'markers',
            type: 'scatter3d',
            name: 'Centroids',
            text: centroids.map((c, i) => `Centroid ${i + 1}: rgb(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)})`),
            marker: {
                size: 12,
                color: centroids.map(c => `rgb(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)})`),
                symbol: 'diamond',
                opacity: 1
            },
            showlegend: false
        };

        // Add legend entry for centroids (shape only, no color)
        const centroidLegendTrace = {
            x: [null],
            y: [null], 
            z: [null],
            mode: 'markers',
            type: 'scatter3d',
            name: 'Centroids',
            marker: {
                size: 12,
                color: 'lightgray',
                symbol: 'diamond',
                opacity: 0.7
            },
            showlegend: true
        };

        plotData.push(centroidTrace);
        plotData.push(centroidLegendTrace);        const layout = {
            title: 'State Flag Colors in 3D RGB Space',
            scene: {
                xaxis: { title: 'Red' },
                yaxis: { title: 'Green' },
                zaxis: { title: 'Blue' }
            },
            margin: { l: 0, r: 0, b: 0, t: 40 }
        };

        // Get current camera position
        const plotDiv = document.getElementById('plot');
        let currentCamera = null;
        if (plotDiv.data && plotDiv.data.length > 0) {
            currentCamera = plotDiv.layout.scene.camera;
        }

        // Update plot while preserving camera position
        if (plotDiv.data && plotDiv.data.length > 0) {
            // Plot exists, update it and restore camera
            Plotly.react('plot', plotData, layout).then(() => {
                if (currentCamera) {
                    Plotly.relayout('plot', { 'scene.camera': currentCamera });
                }
            });
        } else {
            // First time creating the plot
            Plotly.newPlot('plot', plotData, layout);
        }

        // Display clusters
        const clustersDiv = document.getElementById('clusters');
        clustersDiv.innerHTML = '';
        clusters.forEach((cluster, i) => {
            const clusterDiv = document.createElement('div');
            clusterDiv.className = 'cluster';
            const clusterTitle = document.createElement('h2');
            clusterTitle.textContent = `Cluster ${i + 1}`;
            clusterDiv.appendChild(clusterTitle);

            const statesInCluster = cluster.map(stateIndex => stateData[stateIndex]);
            statesInCluster.sort((a, b) => a.name.localeCompare(b.name));

            statesInCluster.forEach(state => {
                const stateItem = document.createElement('div');
                stateItem.className = 'state-item';

                const colorBox = document.createElement('div');
                colorBox.className = 'color-box';
                colorBox.style.backgroundColor = state.rgbString;

                const thumb = document.createElement('img');
                thumb.src = state.thumbnail;
                thumb.alt = state.name;

                const stateName = document.createElement('span');
                stateName.textContent = state.name;

                stateItem.appendChild(colorBox);
                stateItem.appendChild(thumb);
                stateItem.appendChild(stateName);
                clusterDiv.appendChild(stateItem);
            });

            clustersDiv.appendChild(clusterDiv);
        });
    }

    // Initial run
    let result = runKMeans();
    updateVisualization(result);

    // Button event listener
    document.getElementById('rerunButton').addEventListener('click', () => {
        result = runKMeans();
        updateVisualization(result);
    });
});
