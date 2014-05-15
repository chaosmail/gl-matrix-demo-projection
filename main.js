
// Map from (-1,1) to (0,1)
function offset(val) {
    return (val + 1.0) * 0.5;
}

// Create vec4 from vec3
function vec4from3(vertex) {
    return vec4.fromValues(vertex[0], vertex[1], vertex[2], 1.0);
}

function parseVertices(v) {

    vertices = [];

    for (var i = 0; i < v.length; i += 3) {

        vertices.push(vec3.fromValues(v[i], v[i+1], v[i+2]));
    }

    return vertices;
}

var SCENE = d3.select("#scene-container").append("svg").attr("id", "scene");

var app = angular.module('glMatrixDemo', []);

app.controller('MatrixController', function($scope) {

    $scope.settings = {
        SCENE_WIDTH: 1140,
        SCENE_HEIGHT: 320,
        MVP: mat4.create(),
        model: mat4.create(),
        view: mat4.create(),
        projection: mat4.create(),
        CAM_IN: {
            field_of_view: 46.0,
            aspect_ratio: 4.0/3.0,
            near_plane: 0.1,
            far_plane: 2.0
        },
        CAM_EX: {
            cam_pos: vec3.fromValues(2.0, 2.0, 3.0),
            cam_look: vec3.fromValues(0.0, 0.0, 0.0),
            cam_up: vec3.fromValues(0.0, 1.0, 0.0)
        },
        model_translation: vec3.create(),
        model_rotation:vec3.create()
    };

    $scope.axis = {
        object: [
            vec3.fromValues(0.0,0.0,0.0),
            vec3.fromValues(1.0,0.0,0.0),
            vec3.fromValues(0.0,1.0,0.0),
            vec3.fromValues(0.0,0.0,1.0)
        ],
        world: [
            vec3.fromValues(0.0,0.0,0.0),
            vec3.fromValues(1.0,0.0,0.0),
            vec3.fromValues(0.0,1.0,0.0),
            vec3.fromValues(0.0,0.0,1.0)
        ],
        camera: [
            vec3.fromValues(0.0,0.0,0.0),
            vec3.fromValues(1.0,0.0,0.0),
            vec3.fromValues(0.0,1.0,0.0),
            vec3.fromValues(0.0,0.0,1.0)
        ],
        screen: [
            vec3.fromValues(0.0,0.0,0.0),
            vec3.fromValues(1.0,0.0,0.0),
            vec3.fromValues(0.0,1.0,0.0),
            vec3.fromValues(0.0,0.0,1.0)
        ]
    }

    $scope.vertices = {
        object:
            parseVertices([
                // Bottom
                0, 0 ,0,
                0, 0, 1,
                1, 0, 1,
                1, 0, 0,

                // Right
                1, 0, 0,
                1, 1, 0,
                1, 1, 1,
                1, 0, 1,

                // Top
                1, 1, 1,
                0, 1, 1,
                0, 1, 0,
                1, 1, 0,

                // Back
                1, 1, 1,
                0, 1, 1,
                0, 0, 1,
                1, 0, 1,

                // Left
                0, 0, 1,
                0, 0, 0,
                0, 1, 0,
                0, 1, 1,

                // Front
                0, 1, 0,
                1, 1, 0,
                1, 0, 0,
                0, 0, 0
            ]),
        world: [],
        screen: [],
        camera: []
    }

    $scope.init = function() {

        SCENE
            .attr("width", $scope.settings.SCENE_WIDTH)
            .attr("height", $scope.settings.SCENE_HEIGHT);

        $scope.settings.CAM_IN.aspect_ratio =
            $scope.settings.SCENE_WIDTH / $scope.settings.SCENE_HEIGHT;

        if ($scope.settings.CAM_IN.near_plane < $scope.settings.CAM_IN.far_plane) {
            mat4.perspective(
                $scope.settings.projection,
                $scope.settings.CAM_IN.field_of_view,
                $scope.settings.CAM_IN.aspect_ratio,
                $scope.settings.CAM_IN.near_plane,
                $scope.settings.CAM_IN.far_plane
            );
        }
        else {
            mat4.identity($scope.settings.projection);
        }

        if (vec3.length($scope.settings.CAM_EX.cam_up) > 0) {
            mat4.lookAt(
                $scope.settings.view,
                $scope.settings.CAM_EX.cam_pos,
                $scope.settings.CAM_EX.cam_look,
                $scope.settings.CAM_EX.cam_up
            );
        }
        else {
            mat4.identity($scope.settings.view);
        }

        mat4.identity($scope.settings.model);

        mat4.translate(
            $scope.settings.model,
            $scope.settings.model,
            $scope.settings.model_translation
        );

        mat4.rotateX(
            $scope.settings.model,
            $scope.settings.model,
            $scope.settings.model_rotation[0]/180.0*Math.PI
        );

        mat4.rotateY(
            $scope.settings.model,
            $scope.settings.model,
            $scope.settings.model_rotation[1]/180.0*Math.PI
        );

        mat4.rotateZ(
            $scope.settings.model,
            $scope.settings.model,
            $scope.settings.model_rotation[2]/180.0*Math.PI
        );

        var model_view = mat4.create();
        mat4.multiply(
            model_view,
            $scope.settings.view,
            $scope.settings.model
        );

        mat4.multiply(
            $scope.settings.MVP,
            $scope.settings.projection,
            model_view
        );

        for (var i = 0; i < 4; i++) {

            $scope.axis.world[i] = vec4.create();
            vec4.transformMat4($scope.axis.world[i], vec4from3($scope.axis.object[i]), $scope.settings.model);

            $scope.axis.camera[i] = vec4.create();
            vec4.transformMat4($scope.axis.camera[i], $scope.axis.world[i], $scope.settings.view);

            $scope.axis.screen[i] = vec4.create();
            vec4.transformMat4($scope.axis.screen[i], $scope.axis.camera[i], $scope.settings.projection);
        }

        for (var i = 0; i < $scope.vertices.object.length; i ++) {

            $scope.vertices.world[i] = vec4.create();
            vec4.transformMat4($scope.vertices.world[i], vec4from3($scope.vertices.object[i]), $scope.settings.model);

            $scope.vertices.camera[i] = vec4.create();
            vec4.transformMat4($scope.vertices.camera[i], $scope.vertices.world[i], $scope.settings.view);

            $scope.vertices.screen[i] = vec4.create();
            vec4.transformMat4($scope.vertices.screen[i], $scope.vertices.camera[i], $scope.settings.projection);
        }
    }

    $scope.draw = function() {

        var vertices_mvp = [];
        var lines = [];
        var axis = [];

        var vertices = SCENE.selectAll('circle').data($scope.vertices.object);

        // Enter
        vertices.enter().append('circle');

        // Enter and Update
        vertices
            .each(function(vertex, i) {

                vertices_mvp[i] = vec4.fromValues(vertex[0], vertex[1], vertex[2], 1.0);

                // Model View Transform the vertex in screen coordinates
                vec4.transformMat4(vertices_mvp[i], vertices_mvp[i], $scope.settings.MVP);

                if (i !== 0) {
                    lines[i-1] = [vertices_mvp[i-1],vertices_mvp[i]];
                }
            })
            .attr("cx", function(vertex, i) {
                return offset(vertices_mvp[i][0])*$scope.settings.SCENE_WIDTH;
            })
            .attr("cy", function(vertex, i) {
                return (1 - offset(vertices_mvp[i][1]))*$scope.settings.SCENE_HEIGHT;
            })
            .attr("r", 2.0)
            .style("stroke", "black")
            .style("stroke-width", 1.0)
            .style("fill", "red");

        // Exit Elements
        vertices.exit().remove();

        var edges = SCENE.selectAll('.edges').data(lines);

        // Enter
        edges.enter().append('line').attr('class','edges');

        // Enter and Update
        edges
            .attr("x1", function(vertex, i) {
                return offset(vertex[0][0])*$scope.settings.SCENE_WIDTH;
            })
            .attr("y1", function(vertex, i) {
                return (1 - offset(vertex[0][1]))*$scope.settings.SCENE_HEIGHT;
            })
            .attr("x2", function(vertex, i) {
                return offset(vertex[1][0])*$scope.settings.SCENE_WIDTH;
            })
            .attr("y2", function(vertex, i) {
                return (1 - offset(vertex[1][1]))*$scope.settings.SCENE_HEIGHT;
            })
            .style("stroke", "black")
            .style("stroke-width", 1.0);

        // Exit Elements
        edges.exit().remove();


        axis = SCENE.selectAll('.axis-object').data($scope.axis.screen.slice(-3));

        // Enter
        axis.enter().append('line').attr('class','axis-object');

        // Enter and Update
        axis
            .attr("x1", function(vertex, i) {
                return offset($scope.axis.screen[0][0])*$scope.settings.SCENE_WIDTH;
            })
            .attr("y1", function(vertex, i) {
                return (1 - offset($scope.axis.screen[0][1]))*$scope.settings.SCENE_HEIGHT;
            })
            .attr("x2", function(vertex, i) {
                return offset(vertex[0])*$scope.settings.SCENE_WIDTH;
            })
            .attr("y2", function(vertex, i) {
                return (1 - offset(vertex[1]))*$scope.settings.SCENE_HEIGHT;
            })
            .style("stroke", "red")
            .style("stroke-width", 2)
            .style("stroke-opacity", 0.6);

        // Exit Elements
        axis.exit().remove();

        axis = SCENE.selectAll('.axis-world').data($scope.axis.world.slice(-3));

        // Enter
        axis.enter().append('line').attr('class','axis-world');

        // Enter and Update
        axis
            .attr("x1", function(vertex, i) {
                return offset($scope.axis.world[0][0])*$scope.settings.SCENE_WIDTH;
            })
            .attr("y1", function(vertex, i) {
                return (1 - offset($scope.axis.world[0][1]))*$scope.settings.SCENE_HEIGHT;
            })
            .attr("x2", function(vertex, i) {
                return offset(vertex[0])*$scope.settings.SCENE_WIDTH;
            })
            .attr("y2", function(vertex, i) {
                return (1 - offset(vertex[1]))*$scope.settings.SCENE_HEIGHT;
            })
            .style("stroke", "green")
            .style("stroke-width", 2)
            .style("stroke-opacity", 0.6);

        // Exit Elements
        axis.exit().remove();

        axis = SCENE.selectAll('.axis-camera').data($scope.axis.camera.slice(-3));

        // Enter
        axis.enter().append('line').attr('class','axis-camera');

        // Enter and Update
        axis
            .attr("x1", function(vertex, i) {
                return offset($scope.axis.camera[0][0])*$scope.settings.SCENE_WIDTH;
            })
            .attr("y1", function(vertex, i) {
                return (1 - offset($scope.axis.camera[0][1]))*$scope.settings.SCENE_HEIGHT;
            })
            .attr("x2", function(vertex, i) {
                return offset(vertex[0])*$scope.settings.SCENE_WIDTH;
            })
            .attr("y2", function(vertex, i) {
                return (1 - offset(vertex[1]))*$scope.settings.SCENE_HEIGHT;
            })
            .style("stroke", "yellow")
            .style("stroke-width", 2)
            .style("stroke-opacity", 0.6);

        // Exit Elements
        axis.exit().remove();
    }

    $scope.$watch('settings', function() {
        $scope.init();
        $scope.draw();
    }, true);
});