document.addEventListener('DOMContentLoaded', async () => {
    let stateData = [];

    async function loadStateData() {
        try {
            const response = await fetch('state_colors.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            stateData = await response.json();
        } catch (error) {
            console.error("Could not load state data:", error);
            const errorDiv = document.createElement('div');
            errorDiv.textContent = 'Error loading state color data. Please ensure state_colors.json is available.';
            errorDiv.style.color = 'red';
            document.body.insertBefore(errorDiv, document.body.firstChild);
        }
    }

    function distance(a, b) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2));
    }

    function runKMeans() {
        const K = 4;
        let bestClusters = [];
        let bestCentroids = [];
        let bestInertia = Infinity;

        // Run K-Means 32 times and keep the best result
        for (let run = 0; run < 32; run++) {
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

            // Calculate inertia for this run
            let inertia = 0;
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
                inertia += minDist * minDist;
            });

            // Keep the best result
            if (inertia < bestInertia) {
                bestInertia = inertia;
                bestClusters = clusters;
                bestCentroids = centroids;
            }
        }

        // Assign final cluster labels
        stateData.forEach((state, i) => {
            let clusterIndex = 0;
            let minDist = Infinity;
            bestCentroids.forEach((centroid, j) => {
                const dist = distance(state.color, centroid);
                if (dist < minDist) {
                    minDist = dist;
                    clusterIndex = j;
                }
            });
            state.cluster = clusterIndex;
        });

        return { clusters: bestClusters, centroids: bestCentroids };
    }

    function updateVisualization(result) {
        const { clusters, centroids } = result;
        const plotDiv = document.getElementById('plot');
        
        // Preserve the entire layout, including camera position
        const layout = {
            title: 'State Flag Colors in 3D RGB Space',
            scene: {
                xaxis: { title: 'Red' },
                yaxis: { title: 'Green' },
                zaxis: { title: 'Blue' }
            },
            margin: { l: 0, r: 0, b: 0, t: 40 },
        };

        if (plotDiv.layout) {
            // Copy existing camera settings to the new layout
            layout.scene.camera = plotDiv.layout.scene.camera;
        }

        // Prepare data for plotting
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
            x: [null], y: [null], z: [null],
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
        plotData.push(centroidLegendTrace);

        // Use Plotly.react for efficient and smooth updates
        Plotly.react(plotDiv, plotData, layout);

        // Display clusters in the side panel
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

    async function initialize() {
        await loadStateData();
        if (stateData.length > 0) {
            let result = runKMeans();
            updateVisualization(result);

            document.getElementById('rerunButton').addEventListener('click', () => {
                result = runKMeans();
                updateVisualization(result);
            });
        }
    }

    initialize();
});
