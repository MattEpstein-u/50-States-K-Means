# State Flag Colors K-Means Visualization

This project is a web application that visualizes the average colors of the 50 US state flags in a 3D RGB color space. It uses the K-Means clustering algorithm to group the flags into 4 clusters based on their color similarity.

## How It Works

The application consists of a frontend built with HTML, CSS, and JavaScript, and a Python script for data preprocessing.

### 1. Data Preprocessing

-   **`generate_colors.py`**: This Python script calculates the average color for each state flag.
    -   It opens every PNG image in the `state_flags_png/` directory.
    -   It iterates through every pixel to calculate the average Red, Green, and Blue values.
    -   The RGB values are normalized to a [0, 1] range.
    -   The results, including the state name, normalized color vector, an RGB string for CSS, and the path to the thumbnail, are saved into `state_colors.json`.

### 2. Frontend Application

-   **`index.html`**: This is the main HTML file that structures the web page. It includes the 3D plot area, the cluster display panel, and the "Rerun Clustering" button.
-   **`style.css`**: This file contains all the styling for the application, including the layout, button design, and the appearance of the state lists.
-   **`script.js`**: This is the core of the application.
    -   It fetches the pre-calculated color data from `state_colors.json`.
    -   It implements the K-Means clustering algorithm. Both the initial load and the "Rerun Clustering" button run the algorithm 32 times with different random starting points and select the best result (the one with the lowest inertia).
    -   It uses the Plotly.js library to render the interactive 3D scatter plot.
    -   It dynamically generates the lists of states in each cluster.

## How to Run

1.  **Prerequisites**: If you need to regenerate the color data, you will need Python and the Pillow library (`pip install Pillow`).
2.  **Launch the Web App**: Open the `index.html` file using a live server extension in your code editor (like the "Live Server" extension for VS Code). This is necessary to allow the `fetch` API to load the `state_colors.json` file.

## Features

-   **3D Color Space Visualization**: Each state flag is plotted as a point in a 3D space representing its average RGB color.
-   **K-Means Clustering**: The flags are grouped into 4 clusters based on color similarity.
-   **Interactive Plot**: You can zoom, pan, and rotate the 3D plot.
-   **Detailed Information**: Hovering over a point shows the state's name. Centroids are marked with diamond shapes.
-   **Rerun Clustering**: A button allows you to rerun the K-Means algorithm to see different clustering results. The camera position is preserved.
-   **Cluster Lists**: The states are listed alphabetically within their assigned cluster, along with their flag thumbnail and average color swatch.
-   **Efficient**: Color data is pre-calculated and loaded from a JSON file for fast performance.
-   **Robust Clustering**: The algorithm runs 32 times for both initial load and reruns to find the best clustering among the runs and avoid suboptimal results.
