function Edicao(data) {
	//TODO: Esta variável eu preciso mudar conforme a publicação do App, cada aplicativo terá seu endereço.
	// var source = '';
	var source = 'http://10.0.1.135:83/media/';
	var androzip = require('com.websiteburo.androzip');
	// var edicaoDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, data.id);
	var edicaoDir = Ti.Filesystem.getFile(Ti.Filesystem.externalStorageDirectory, data.id);
	//cria diretorio da revista se ainda nao existir, o nome é editionId
	if (!edicaoDir.exists()) {
		edicaoDir.createDirectory();
	}
	edicaoDir = null;

	//View onde é adicionada cada edição.
	var self = Ti.UI.createView({
		width : 'auto',
		height : '250px',
		backgroundImage : 'viewBG.png',
		top : 10,
		left : 10,
		right : 10
	});

	//---------------------------------------------------View da imagem da capa.
	var thumbView = Ti.UI.createView({
		// borderColor : 'red',
		// borderRadius : 2,
		// borderWidth : 2,
		left : 5,
		top : 5,
		bottom : 5,
		width : '22%'
	});

	var thumb = Ti.UI.createImageView({
		height : 'auto',
		width : 'auto'
	});

	thumbView.add(thumb);

	//---------------------------------------------------View das informações das edições.
	var textView = Ti.UI.createView({
		// borderColor : 'black',
		// borderRadius : 2,
		// borderWidth : 2,
		top : 5,
		left : '25%',
		right : 5,
		bottom : 50
	});

	//Label com o numero da edição
	var edition = Ti.UI.createLabel({
		color : '#323030',
		font : {
			fontSize : '26%',
			fontWeight : 'bold'
		},
		text : data.nome,
		top : 5,
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER
	});

	textView.add(edition);

	//Label com o títlulo da edição
	var title = Ti.UI.createLabel({
		color : '#323030',
		font : {
			fontSize : '20%',
			fontWeight : 'bold'
		},
		text : data.titulo_capa,
		top : 50,
		textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER
	});

	textView.add(title);

	//Label com a descrição da capa.
	var description = Ti.UI.createLabel({
		color : '#323030',
		font : {
			fontSize : '16%',
			fontWeight : 'normal'
		},
		text : data.descricao_capa,
		top : 105,
		width : 'auto'
	});

	textView.add(description);

	//---------------------------------------------------View dos botões.
	var buttonView = Ti.UI.createView({
		// borderColor : 'yellow',
		// borderRadius : 2,
		// borderWidth : 2,
		height : 50,
		left : '25%',
		right : 5,
		bottom : 5
	});

	var pb = Ti.UI.createProgressBar({
		width : '50%',
		height : 'auto',
		right : 10,
		min : 0,
		max : 100,
		value : 0,
		color : '#fff',
		message : 'Downloading',
		font : {
			fontSize : 14,
			fontWeight : 'bold'
		},
		visible : false
	});

	buttonView.add(pb);

	var downloadBt = Ti.UI.createButton({
		backgroundImage : 'baixar.png',
		right : 10,
		height : 31,
		width : 105,
		visible : (data.downloaded == 1 ? false : true)
	});

	downloadBt.addEventListener('click', function(e) {
		if (Ti.Network.online) {
			downloadBt.visible = false;
			pb.visible = true;
			loadFile();
		} else {
			pb.visible = false;
			downloadBt.visible = true;
			alert("Verifique sua conexão com a internet e tente fazer o download novamente.");
		}
	});

	buttonView.add(downloadBt);

	var deldBt = Ti.UI.createButton({
		backgroundImage : 'deletar.png',
		right : 10,
		height : 31,
		width : 105,
		visible : (data.downloaded == 0 ? false : true)
	});

	deldBt.addEventListener('click', function(e) {
		deldBt.visible = true;
		deleteFile();
	});

	buttonView.add(deldBt);

	var abrirBt = Ti.UI.createButton({
		backgroundImage : 'abrir.png',
		right : 125,
		height : 31,
		width : 105,
		visible : (data.downloaded == 0 ? false : true)
	});

	abrirBt.addEventListener('click', function(e) {
		var Window = require('Revista');
		var w = new Window(data);

		var listener = function() {
			w.removeEventListener('close', listener);
			w.fechar();
			w = Ti.UI.createWindow();
			w = null;
			listener = null;
			Window = null;
			delete Window;
		}

		w.open();

		w.addEventListener('close', listener);
	});

	buttonView.add(abrirBt);

	self.add(thumbView);
	self.add(textView);
	self.add(buttonView);

	getThumb();
	/*
	 * funcao q exibe a miniatura, verifica se o arquivo esta local, se nao estiver faz o download e atualiza o banco
	 */
	function getThumb() {
		var remote = data.thumbnail;
		remote = remote.split("/");
		remote.reverse();
		var local = data.id + '/' + remote[0];
		var thumbName = remote[0];

		// var imageFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory + local);
		var imageFile = Ti.Filesystem.getFile(Ti.Filesystem.externalStorageDirectory + local);

		if (local != null) {
			var localA = local.split("/");
			localA.reverse();
			/*
			 * verifica se o arquivo local tem o mesmo nome do remoto
			 */
			if (localA[0] == remote[0]) {
				if (imageFile.exists()) {
					// thumb.image = local;
					thumb.image = imageFile;
				} else {
					loadThumb(thumbName);
				}
			} else {
				loadThumb(thumbName);
			}
		} else {
			loadThumb(thumbName);
		}
	}

	function loadThumb(fileName) {
		if (!Ti.Network.online)
			return;
		var xhr = Titanium.Network.createHTTPClient();

		xhr.onload = function() {
			// var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, data.id + Ti.Filesystem.separator + fileName);
			var f = Ti.Filesystem.getFile(Ti.Filesystem.externalStorageDirectory, data.id + Ti.Filesystem.separator + fileName);
			f.write(this.responseData);

			if (f.exists()) {
				thumb.image = f;
			}

			var db = Ti.Database.open('revistaDB');

			db.execute("UPDATE revista SET localThumb='" + f.resolve() + "' WHERE id='" + data.id + "'");

			db.close();

			f = null;
		};

		xhr.open('GET', source + data.thumbnail);
		xhr.send();
	}

	function loadFile() {
		var xhr = Titanium.Network.createHTTPClient();

		xhr.onload = function() {
			// var dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, data.id + Ti.Filesystem.separator + "files");
			var dir = Ti.Filesystem.getFile(Ti.Filesystem.externalStorageDirectory, data.id + Ti.Filesystem.separator + "files");

			if (! dir.exists()) {
				dir.createDirectory();
			}

			// var path = Ti.Filesystem.applicationDataDirectory + data.id + Ti.Filesystem.separator + "files/";
			var path = Ti.Filesystem.externalStorageDirectory + data.id + Ti.Filesystem.separator + "files/";
			var f = Ti.Filesystem.getFile(path, "file.zip");
			f.write(this.responseData);

			androzip.extract(f.nativePath, dir.nativePath);

			f.deleteFile();

			abrirBt.visible = true;
			deldBt.visible = true;
			pb.visible = false;

			var db = Ti.Database.open('revistaDB');
			data.downloaded = 1;
			db.execute("UPDATE revista SET downloaded='" + data.downloaded + "'WHERE id='" + data.id + "'");
			db.close();

			dir = null;
			f = null;
		};

		xhr.ondatastream = function(e) {
			pb.value = e.progress * 100;
		}
		//TODO: Criar uma função que quando a conexão cai, apresentar na tela uma mensagem de erro.
		xhr.onerror = function(e) {
			Ti.API.debug(e.error);
			pb.visible = false;
			downloadBt.visible = true;
			alert('Erro ao carregar arquivo, verifique a conexão e tente novamente.');
		}

		xhr.open('GET', source + data.zip);
		xhr.send();
	}

	function deleteFile() {
		// var dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, data.id + Ti.Filesystem.separator + "files");
		var dir = Ti.Filesystem.getFile(Ti.Filesystem.externalStorageDirectory, data.id + Ti.Filesystem.separator + "files");

		if (dir.exists()) {
			dir.deleteDirectory(true);
		}

		deldBt.visible = false;
		abrirBt.visible = false;
		downloadBt.visible = true;

		var db = Ti.Database.open('revistaDB');
		data.downloaded = 0;
		db.execute("UPDATE revista SET downloaded='" + data.downloaded + "'WHERE id='" + data.id + "'");
		db.close();
		dir = null;
	}

	return self;
}

//make constructor function the public component interface
module.exports = Edicao;
