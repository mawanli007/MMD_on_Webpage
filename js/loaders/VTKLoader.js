/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.VTKLoader = function () {

	THREE.EventDispatcher.call( this );

};

THREE.VTKLoader.prototype = {

	constructor: THREE.VTKLoader,

	load: function ( url, callback ) {

		var scope = this;
		var request = new XMLHttpRequest();

		request.addEventListener( 'load', function ( event ) {

			var geometry = scope.parse( event.target.responseText );

			scope.dispatchEvent( { type: 'load', content: geometry } );

			if ( callback ) callback( geometry );

		}, false );

		request.addEventListener( 'progress', function ( event ) {

			scope.dispatchEvent( { type: 'progress', loaded: event.loaded, total: event.total } );

		}, false );

		request.addEventListener( 'error', function () {

			scope.dispatchEvent( { type: 'error', message: 'Couldn\'t load URL [' + url + ']' } );

		}, false );

		request.open( 'GET', url, true );
		request.send( null );

	},

	parse: function ( data ) {

		var geometry = new THREE.Geometry();

        // 以独立材质为索引的geometry数组
        var geometries = [];
        // 储存材质序号（可被简化掉）
        var n_material = [];
        // 以独立点为索引的所属UV数据
		var n_uvs = [];
		// 以独立点为索引的顶点所属骨骼数据
		var n_bones = [];
		// 以骨骼编号存储骨骼信息的数组
		var bones = [];

		function vertex( x, y, z ) {

			geometry.vertices.push( new THREE.Vector3( x, y, z ) );

		}

		var pattern, result;

		// float float float float float int int float

		pattern = /([\+|\-]?[\d]+[\.][\d|\-|e]+)[ ]+([\+|\-]?[\d]+[\.][\d|\-|e]+)[ ]+([\+|\-]?[\d]+[\.][\d|\-|e]+)[ ]+([\+|\-]?[\d]+[\.][\d|\-|e]+)[ ]+([\+|\-]?[\d]+[\.][\d|\-|e]+)[ ]+([\d]+)[ ]+([\d]+)[ ]+([\+|\-]?[\d]+[\.][\d|\-|e]+)/g;

		while ( ( result = pattern.exec( data ) ) != null ) {
			// 压入顶点数组（唯一）
			vertex( parseFloat( result[ 1 ] ), parseFloat( result[ 2 ] ), parseFloat( result[ 3 ] ) );
			// 压入uv数组（唯一）
            n_uvs.push( new THREE.Vector2(parseFloat( result[ 4 ] ), 1.0-parseFloat( result[ 5 ] )));
            // 压入所属骨骼数组
			n_bones.push([parseInt(result[6]), parseInt(result[7]), parseFloat( result[ 8 ] )]);
		}

		// 3 int int int int (string)

		pattern = /3[ ]+([\d]+)[ ]+([\d]+)[ ]+([\d]+)[ ]+([\d]+)[ ]+\((.+)\)/g;

		while ( ( result = pattern.exec( data ) ) != null ) {

			// 看有没有该材质，没有的话就添加，现在材质就只有贴图
			if (!(parseInt( result[ 4 ] ) in n_material))
			{
                var gm = new THREE.Geometry();
                n_material.push(parseInt(result[4]));
                geometries.push([gm, result[5]]);
            }

            // 压入顶点数组中依次排列的顶点三角形
            geometries[parseInt(result[4])][0].faces.push( new THREE.Face3( parseInt( result[ 1 ] ), parseInt( result[ 2 ] ), parseInt( result[ 3 ] ) ));
			// 在n_uvs中找到顶点对应的uv，连成三角形压入faceVertexUvs中
            geometries[parseInt(result[4])][0].faceVertexUvs[0].push([n_uvs[parseInt( result[ 1 ] )], n_uvs[parseInt( result[ 2 ] )], n_uvs[parseInt( result[ 3 ] )]]);

		}

        // b int int int float float float (string)

        pattern = /b[ ]+([\d]+)[ ]+([\+|\-]?[\d]+)[ ]+([\+|\-]?[\d]+)[ ]+([\+|\-]?[\d]+[\.][\d|\-|e]+)[ ]+([\+|\-]?[\d]+[\.][\d|\-|e]+)[ ]+([\+|\-]?[\d]+[\.][\d|\-|e]+)[ ]+\((.+)\)/g;

		while ( ( result = pattern.exec( data ) ) != null ) {
            // 3个整数分别是骨骼自己的编号，父骨骼编号，子骨骼编号
			// 3个浮点数是骨骼位置，字符串为骨骼名称
			bones.push([parseInt( result[ 1 ] ), parseInt( result[ 2 ] ), parseInt( result[ 3 ] ), new THREE.Vector3(parseFloat( result[ 4 ] ), parseFloat( result[ 5 ] ), parseFloat( result[ 6 ] )), result[7]]);
        }

		for (var i = 0; i < geometries.length; i++)
		{
			// 将顶点数据赋给所有部分
			geometries[i][0].vertices = geometry.vertices;
            geometries[i][0].computeCentroids();
            geometries[i][0].computeFaceNormals();
            geometries[i][0].computeVertexNormals();
            geometries[i][0].computeBoundingSphere();
		}

		return geometries;
	}
}
