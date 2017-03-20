var data_config = [
    {
        name: "synthetic",
        path: "data/synthetic-4-1-1.csv",
        attr: {
            all: ["v","w","x","y","z","class"],
            use: [0, 1, 2, 3, 4]
        },
        category: {
            name: "class",
            index: 5,
            values: ["A", "B", "C", "D"]
        },
        animate: {
            isAnimate: true,
            initDraw: true
        }
    },
    {
        name: "diamonds",
        path: "data/diamonds-shuffled-all.csv",
        attr: {
            all: ["","carat","cut","color","clarity","depth","table","price","x","y","z"],
		    use: [1, 5, 6, 7, 8, 9, 10]
        },
        category: {
            name: "cut",
		    index: 2,
		    values: ["Fair", "Good", "Very Good", "Premium", "Ideal"]
        },
        animate: {
            isAnimate: true
        }
    }
];

function get_data_config() {
    var dataset_name = document.getElementById("data-select").value;
    var config = data_config.filter(function(data){
        return data.name === dataset_name;
    })[0];
    return config;
}