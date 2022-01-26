namespace FileUploader {
    export class Init {
        constructor(args: any) {
            return new Uploader(args);
        }
    }
    class Uploader {
        private lrz: any;
        private file: any;
        private formData: FormData = new FormData();
        private uploaderDom:any;
        public option: UploaderOption = new UploaderOption()
        constructor(arg: any) {
            var _this=this;
            this.option = Object.assign(this.option, arg);
            this.lrz = window.lrz;
            if(this.lrz==undefined){
                this.loadJS('https://cdn.jsdelivr.net/gh/t-jian/static/js/lrz-4.9.41/lrz.all.bundle.js',()=>{
                    this.lrz=window.lrz;
                })
            }
            if(this.option.isShowLoading){
              this.uploaderDom= document.querySelector(".uploader-box")
                if(this.uploaderDom==null){
                    let css='.uploader-box{display:none;width:100%;height:100%;background-color:rgba(100,100,100,0.65);z-index:10;position:fixed;}.uploader-box .loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border:3px solid #f3f3f3;border-top:3px solid #555;border-radius:100%;width:40px;height:40px;display:inline-block;animation:loaderSpin 1.5s linear infinite;}@keyframes loaderSpin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}';
                    this.createStyleSheet(css);
                   let nodeBox=document.createElement("div");
                   nodeBox.className="uploader-box";
                   let node= document.createElement("div");
                   node.className="loader";
                   nodeBox.appendChild(node);
                   document.querySelector(this.option.inputFileBox==""?this.option.inputId:this.option.inputFileBox).parentNode.appendChild(nodeBox);
                   this.uploaderDom= document.querySelector(".uploader-box");
                }
            }
            if(this.option.beforeUpload==null){
                this.option.beforeUpload=this.beforeUploadCallback;
            }
            if(arg.file==null){
                this.changeFileUpload();
            }else{
                this.compressHandle().then(res => {
                    if (_this.option.autoUpload) {
                        _this.request();
                    }
                })
            }
        }
        private changeFileUpload() {
            let _this = this;
            let fileInput = document.querySelector(this.option.inputId);
            if (fileInput == undefined || fileInput == null) {
                console.error("no find input ");
                return;
            }
            fileInput.addEventListener('change', function () {
                let file = this.files[0];
                _this.file = file;
                _this.compressHandle().then(res => {
                    if (_this.option.autoUpload) {
                        _this.request();
                    }
                })
            })
        }
        private beforeUploadCallback(file:any){
            return true;
        }
        private compressHandle() {
            var _this = this;
            if(!_this.option.beforeUpload(_this.file)) return;
            return new Promise(function (resolve, reject) {
                if (_this.option.isCompress) {
                    if(_this.lrz==undefined||_this.lrz==null){
                        _this.createOriginalFormData(resolve);
                    }else{
                        _this.compress(_this.file).then((rst: any) => {
                            _this.formData = rst.formData;
                            _this.appendExtendformData(_this.formData);
                            resolve(true);
                        }).catch((err: any) => {
                            console.error(err,"压缩异常");
                            _this.createOriginalFormData(resolve);
                        })
                    }
                } else {
                    _this.createOriginalFormData(resolve);
                   
                }
            })
        }
        private showOrHideLoading(b=true){
          this.uploaderDom.setAttribute("style",b?"display:block":"display:none"); 
        }
        private createOriginalFormData(resolve:any) {
            var _this=this;
            var formData = new FormData();
            this.appendExtendformData(formData);
            this.fileConvertBase64(this.file).then((res:any)=>{
                formData.append(this.option.fieldName,  _this.convertBase64UrlToBlob(res),_this.file.name);
                _this.formData=formData;
                resolve(true);
            });
           
        }

        private appendExtendformData(formData: any) {
            //追加扩展
            if (this.option.requestExtendData != null) {
                Object.keys(this.option.requestExtendData).forEach(function (key) {
                    formData.append(key, this.option.requestExtendData[key]);
                });
            }
        }
        /**
        * 文件压缩
        * @param file 文件
        */
        private compress(file: any) {
            var _this = this;
            var lrzOption: any = {
                quality: this.option.quality > 1 ? 1 : this.option.quality < 0 ? 0 : this.option.quality,
                fieldName: this.option.fieldName
            };
            return new Promise(function (resolve, reject) {
                _this.fileConvertBase64(file).then((res:any)=>{
                var img=new Image();
                img.src=res;
                img.onload = function(e){
                    let tWidth = 0,theight=0;
                    if(_this.option.width==null){
                        if (_this.option.scale !=0) {
                            tWidth = _this.option.scale * img.width;
                        } else {
                            tWidth = img.width;
                        }
                    }else{
                        tWidth=_this.option.width;
                        if(img.width<tWidth){
                            tWidth=img.width;
                        }
                    }
                    lrzOption.width = tWidth;
                    if(_this.option.height==null){
                        if (_this.option.scale !=0) {
                            theight = _this.option.scale * img.height;
                        } else {
                            theight = img.height;
                        }
                    }else{
                        theight=_this.option.width;
                        if(img.height<theight){
                            theight=img.height;
                        }
                    }
                    lrzOption.width = Math.floor(tWidth);
                    lrzOption.height = Math.floor(theight);
                    if(_this.option.maxWidth!=null&&tWidth>_this.option.maxWidth){
                        lrzOption.width=_this.option.maxWidth;
                    }
                    _this.lrz(file, lrzOption).then(resolve).catch(reject).always(() => {console.log("进入压缩流程")});
                }
            }).catch((err:any)=>{
                _this.lrz(file, lrzOption).then(resolve).catch(reject).always(() => {console.log("进入压缩流程")});
            })
        });
        }

        /**
         * 上传
         * @param formData 数据对象
         */
        private request() {
            if(this.option.httpResult!=null){
                if (typeof this.option.httpResult == "function") {
                    this.option.httpResult(this.formData,this.file);
                    return;
                }
            }
            var _this = this;
            _this.showOrHideLoading();
            var xhr = new XMLHttpRequest();
            xhr.open('POST', _this.option.url);
            if(this.option.requestHeader!=null){
                Object.keys(this.option.requestHeader).forEach(function (key) {
                    xhr.setRequestHeader(key,this.option.requestHeader[key]);
                });
            }
            xhr.onload = function () {
                var data = JSON.parse(xhr.response);
                if (xhr.status === 200) {
                    if (typeof _this.option.success == "function") {
                        _this.option.success(data);
                    }
                    _this.option.progress = 0;
                } else {
                    if (typeof _this.option.fail == "function") {
                        _this.option.fail(data);
                    }
                }
                _this.showOrHideLoading(false);
            };
            xhr.onerror = function (err) {
                if (typeof _this.option.fail == "function") {
                    _this.option.fail(err);
                }
               _this.showOrHideLoading(false);
            };
            if (xhr.upload) {
                try {
                    xhr.upload.addEventListener('progress', function (e) {
                        if (!e.lengthComputable) return false;
                        if (typeof _this.option.progressCallback == "function") {
                            _this.option.progressCallback(e);
                        }
                    });
                } catch (err) {
                    console.error('进度展示出错了,似乎不支持此特性?', err);
                }
            }
            console.log(_this.formData, 999)
            xhr.send(_this.formData);
        }
         /**
          * 将文件转成base64
          * @param file 文件
          * @returns 
          */
       private fileConvertBase64(file:any){
            return new Promise(function (resolve, reject) {
                if(window.FileReader) {  
                    var reads = new FileReader();
                    reads.readAsDataURL(file);
                    reads.onload = function (e) {
                        resolve(this.result);
                    }
                    reads.onerror=function(e){
                        reject(e);
                    }
                }  
                else { 
                    console.info("Not supported by your browser!"); 
                    reject("Not supported by your browser!")
                }  
            })
       }
    /**
     * 将base64 转成 blob
     * @param urlData base64
     * @returns 
     */
        private convertBase64UrlToBlob(urlData:string) {
            var arr = urlData.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: mime });
        }

        private  loadJS(url:string, callback:any ){
            var script = document.createElement('script');
            var fn = callback || function(){};
            script.type = 'text/javascript';
            script.onload = function(){ fn();};
            script.src = url;
            document.getElementsByTagName('head')[0].appendChild(script);
        }
        private createStyleSheet(css:string) {
            var head = document.head || document.getElementsByTagName('head')[0];
            var style = document.createElement('style');
            style.type = 'text/css';
            style.textContent=css;
            head.appendChild(style);
            return style.sheet;
        }
        /**
         * 用于主动上传
         * @returns 
         */
        public Invoke(){
            if(this.file=null){
                console.error("file is null");
                return;
            }
            this.request();
        }

    }
    class UploaderOption {
        public inputId: string = "#inputId";//文件域id
        public inputFileBox:string="";//input 外层盒子 可用于loading区域,空时取文件域的最外层
        public isCompress: boolean = true;//默认压缩
        public autoUpload: boolean = true;//是否自动上传
        public url: string;
        public quality: number = 0.8;//图片压缩质量，取值 0 - 1，默认为0.8
        public scale:number=0.9;//图片大小缩放
        public width: number;//图片最大不超过的宽度，默认为原图宽度，高度不设时会适应宽度
        public maxWidth:number;//图片最大宽度
        public height: number;// 同上
        public fieldName: string = "file";//后端接收的字段名，默认：file
        public progress: number = 0;
        public isShowLoading:boolean=true;//是否显示loading
        public beforeUpload:any;//上传文件之前的钩子，参数为上传的文件。 若返回true才触发上传
        public success: any;//文件上传成功
        public fail: any;//文件上传失败
        public progressCallback: any;//进度条回调
        public httpResult:any;//允许重写上传但无法触发success、fail、progressCallback 函数
        public requestHeader:any;//允许设置请求头
        public requestExtendData: any;//允许提交额外的参数
        constructor() {
            return this;
        }
    }
}
