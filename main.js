
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
        }
    };

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
        eye: [],
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

        var model_view = mat4.create();
        mat4.multiply(
            model_view,
            $scope.settings.model,
            $scope.settings.view
        );

        mat4.multiply(
            $scope.settings.MVP,
            $scope.settings.projection,
            model_view
        );

        for (var i = 0; i < $scope.vertices.object.length; i ++) {

            var v1 = vec4.create();
            vec4.transformMat4(v1, vec4from3($scope.vertices.object[i]), $scope.settings.model);
            $scope.vertices.world[i] = v1;

            var v2 = vec4.create();
            vec4.transformMat4(v2, vec4from3($scope.vertices.object[i]), model_view);
            $scope.vertices.camera[i] = v2;

            var v3 = vec4.create();
            vec4.transformMat4(v3, vec4from3($scope.vertices.object[i]), $scope.settings.MVP);
            $scope.vertices.eye[i] = v3;
        }
    }

    $scope.draw = function(v) {

        var vertex_mv = [];
        var vertices_mvp = [];
        var lines = [];
            lines[0] = [];

        var vertices = SCENE.selectAll('circle').data(v);

        // Enter
        vertices.enter().append('circle');

        // Enter and Update
        vertices
            .each(function(vertex, i) {

                vertices_mvp[i] = vec4.fromValues(vertex[0], vertex[1], vertex[2], 1.0);

                // Model View Transform the vertex in eye coordinates
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

        var edges = SCENE.selectAll('line').data(lines);

        // Enter
        edges.enter().append('line');

        // Enter and Update
        edges
            .attr("x1", function(vertex, i) {
                console.log(vertex);
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
    }

    $scope.$watch('settings', function() {
        $scope.init();
        $scope.draw($scope.vertices.object);
    }, true);
});