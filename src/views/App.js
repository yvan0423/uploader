import React, { Component } from 'react';
import propTypes from 'prop-types';
import reqwest from 'reqwest';
import { getFileType, safeB64Encode } from 'method/toolFunction';
import { QINIU_DOMAIN } from 'method/constants';

class Uploader extends Component {
	constructor(props) {
		super(props);
		this.state = {
			sliceSize: this.props.sliceSize > 4 ? 16777216 : this.props.sliceSize * 1048576,
			sliceInfo: {},
			uploadPath: []
		};
		this.onChange = this.onChange.bind(this);
		this.beforeUpload = this.beforeUpload.bind(this);
		this.uploadFiles = this.uploadFiles.bind(this);
		this.directUpload = this.directUpload.bind(this);
		this.blockUpload = this.blockUpload.bind(this);
		this.chunkUpload = this.chunkUpload.bind(this);
		this.MKFile = this.MKFile.bind(this);
		this.noTokenUpload = this.noTokenUpload.bind(this);
	}

	beforeUpload(files) {
		const { beforeUpload, onError } = this.props;
		const before = beforeUpload(files[0], files);

		if(!beforeUpload) {
			return setTimeout(() => this.uploadFiles(files), 0);
		}

		if(before && before.then) {
			before.then((processedFile) => {
				const processedFileType = Object.prototype.toString.call(processedFile);
				if (processedFileType === '[object File]' || processedFileType === '[object Blob]') {
		          this.uploadFiles(processedFile);
		        } else {
		          this.uploadFiles(files);
		        }
			}).catch((error) => {
				onError(error, files[0], files);
				console.error(error);
	      });
		} else if(before !== false) {
			setTimeout(() => this.uploadFiles(files), 0);
		}
	}

	uploadFiles(files) {
		const postFiles = Array.prototype.slice.call(files);
		if(this.props.noToken) {
			for(var i = 0; i < postFiles.length; i++) {
				this.directUpload(postFiles[i]);
			}
			return
		}
		const isCover = this.props.isCover ? 1 : 0;
		const tokenQuery = postFiles.map((file) => {
			return {
				fileDesc: '',
				fileHash: new Date(),
				fileName: file.name,
				fileType: getFileType(file.type),
				isCover: postFiles.length > 1 ? 0 : isCover
			};
		});
		reqwest({
			url: this.props.tokenApi,
			method: 'post',
			data: JSON.stringify(tokenQuery),
			contentType: 'application/json'
		}).then((response) => {
			for(var i = 0; i < response.res.length; i++) {
				const fileInfo = {
					fileToken: response.res[i].fileToken,
					filePath: response.res[i].filePath,
				};
				if(postFiles[i].size > this.state.sliceSize) {
					let _sliceInfo = {};
					const uid = +(new Date());
					_sliceInfo[uid] = {
						blockCutNum: 0,
						blockResponse: {},
						chunkResponse: {},
						chunkCutNum: 1,
						ctxList: []
					};
					const sliceInfo = Object.assign({}, this.state.sliceInfo, _sliceInfo);
					this.setState({
						sliceInfo: sliceInfo
					}, () => {
						this.blockUpload(postFiles[i], fileInfo, uid);
					});
				} else {
					this.directUpload(postFiles[i], fileInfo);
				}
			}
		}).fail((error) => {
			this.props.onError(error, files[0], files);
			console.error(error);
		});
	}

	noTokenUpload(files) {
		for(var i = 0; i < files.length; i++) {
			reqwest({
				url: 'https://up.qbox.me',
				method: 'post',
				processData: false,
				data: formData
			});
		}
	}

	directUpload(file, fileInfo) {
		const { noToken, upApi, onUploaded, onError } = this.props;
		let formData = new FormData();
		if(!noToken) {
			const domain = file.type.match('image') ? QINIU_DOMAIN.IMAGE : QINIU_DOMAIN.RESOURCE;
			formData.append('key', fileInfo.filePath);
			formData.append('token', fileInfo.fileToken);
			formData.append('name', file.name);
			formData.append('domain', domain);
		}
		formData.append('file', file);
		reqwest({
			url: noToken ? upApi : 'https://up.qbox.me',
			method: 'post',
			processData: false,
			data: formData
		}).then((response) => {
			onUploaded(response.res.filePath);
		}).fail((error) => {
			onError(error);
			console.error(error);
		});
	}

	blockUpload(file, fileInfo, uid) {
		// 创建块
		const { sliceSize, sliceInfo } = this.state;
		const { blockCutNum } = sliceInfo[uid];
		if(Math.ceil(file.size / sliceSize) > blockCutNum) {
			let blockData, _sliceSize;
			if(Math.ceil(file.size / sliceSize) == blockCutNum + 1) {
				blockData = file.slice(blockCutNum * sliceSize, file.size);
				_sliceSize = file.size - sliceSize * blockCutNum;
			} else {
				blockData = file.slice(blockCutNum * sliceSize, (blockCutNum + 1) * sliceSize);
				_sliceSize = sliceSize;
			}
			reqwest({
				url: `https://up.qbox.me/mkblk/${_sliceSize}`,
				method: 'post',
				contentType: 'application/octet-stream',
				headers: {
					Authorization: `UpToken ${fileInfo.fileToken}`
				},
				processData: false,
				data: blockData.slice(0, 1048576)
			}).then((response) => {
				const uidInfo = Object.assign({}, sliceInfo[uid], { blockResponse: response });
				let _sliceInfo = {};
				_sliceInfo[uid] = uidInfo;
				this.setState({
					sliceInfo: Object.assign({}, sliceInfo, _sliceInfo)
				}, () => {
					this.chunkUpload(blockData, file, fileInfo, uid);
				});
			}).fail((error) => {
				this.props.onError(error, files[0], files);
				console.error(error);
			});
		} else {
			this.MKFile(file, fileInfo, uid);
		}
	}

	chunkUpload(blockData, file, fileInfo, uid) {
		// 上传切片
		const { onProgress, onError } = this.props;
		const { sliceInfo, sliceSize } = this.state;
		const { chunkResponse, chunkCutNum, blockCutNum, ctxList, blockResponse } = sliceInfo[uid];
		const url = `${chunkCutNum == 1 ? 'https://up.qbox.me' : blockResponse.host}/bput/${chunkCutNum == 1 ? blockResponse.ctx : chunkResponse.ctx}/${chunkCutNum * 1048576}`;
		let chunkData;
		if(Math.ceil(blockData.size / 1048576) == chunkCutNum + 1) {
			chunkData = blockData.slice(chunkCutNum * 1048576, blockData.size);
		} else {
			chunkData = blockData.slice(chunkCutNum * 1048576, (chunkCutNum + 1) * 1048576);
		}
		reqwest({
			url: url,
			method: 'post',
			contentType: 'application/octet-stream',
			headers: {
				Authorization: `UpToken ${fileInfo.fileToken}`
			},
			processData: false,
			data: chunkData
		}).then((response) => {
			if(Math.ceil(blockData.size / 1048576) > chunkCutNum + 1) {
				const uidInfo = Object.assign({}, sliceInfo[uid], { chunkResponse: response }, { chunkCutNum: chunkCutNum + 1 });
				let _sliceInfo = {};
				_sliceInfo[uid] = uidInfo;
				this.setState({
					sliceInfo: Object.assign({}, sliceInfo, _sliceInfo)
				}, () => {
					this.chunkUpload(blockData, file, fileInfo, uid);
				});
			} else {
				const uidInfo = Object.assign({}, sliceInfo[uid], { chunkCutNum: 1 }, { blockCutNum: blockCutNum + 1 }, { ctxList: [].concat(ctxList, response.ctx) })
				let _sliceInfo = {};
				_sliceInfo[uid] = uidInfo;
				this.setState({
					sliceInfo: Object.assign({}, sliceInfo, _sliceInfo)
				}, () => {
					this.blockUpload(file, fileInfo, uid);
				});
			}
			onProgress(file, (blockCutNum * sliceSize + chunkCutNum * 1048576));
		}).fail((error) => {
			onError(error);
			console.error(error);
		});
	}

	MKFile(file, fileInfo, uid) {
		// 生成文件
		const { sliceInfo, uploadPath } = this.state;
		const { chunkResponse, ctxList } = sliceInfo[uid];
		reqwest({
			url: `${chunkResponse.host}/mkfile/${file.size}/key/${safeB64Encode(fileInfo.filePath)}/fname/${safeB64Encode(fileInfo.filePath)}`,
			contentType: 'text/plain',
			method: 'post',
			headers: {
				Authorization: `UpToken ${fileInfo.fileToken}`
			},
			data: ctxList.toString()
		}).then((response) => {
			const uploadedArr = [].concat(uploadPath, response.res.filePath);
			this.setState({
				sliceInfo: {},
				uploadPath: uploadedArr
			}, () => {
				if(uploadPath.length = file.length) {
					this.props.onUploaded(uploadPath);
				}
			});
		}).fail((error) => {
			this.props.onError(error);
			console.log(error);
		});
	}

	onChange(e) {
		const { files } = e.target;
		this.props.fileAdded(files[0], files);
		this.beforeUpload(files);
	}

	render() {
		const { disabled, multiple } = this.props;
		return (
			<div>
				<input disabled={disabled} type="file" onChange={this.onChange} multiple={multiple}/>
			</div>
		);
	}
}

Uploader.PropTypes = {
	sliceSize: propTypes.number,
	isCover: propTypes.bool,
	multiple: propTypes.bool,
	tokenApi: propTypes.string,
	beforeUpload: propTypes.func,
	fileAdded: propTypes.func,
	onProgress: propTypes.func,
	onUploaded: propTypes.func,
	onError: propTypes.func,
	disabled: propTypes.bool,
	noToken: propTypes.bool
};

Uploader.defaultProps = {
	sliceSize: 4,
	isCover: false,
	multiple: false,
	tokenApi: '/manage/upload/tokens',
	beforeUpload: () => {},
	fileAdded: () => {},
	onProgress: () => {},
	onUploaded: () => {},
	onError: () => {},
	disabled: false,
	noToken: false
}

module.exports = Uploader;