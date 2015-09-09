#Codovar 主要使用文档

###1.在index.html中合入cordova.js

```html
<script type="text/javascript" src="cordova.js"></script>
```

###2.将屏保程序文件放入android/src相应的包中
>Bridge.java  MainActivity.java  MyService.java  Receiver.java

__注意将文件中的包名改为当前项目所在的包名`com.inno.xxx`__

###3.在Android的AndroidManifest.xml中添加Server

放在`</activity>`标签之后

```html
<service android:name="MyService" />
```

###4.向plugins/android.json里添加CordovaPlugin: Bridge

Brige类继承自CordovaPlugin, 用于javascript与Android之间的通信

```html
{
    "xml": "<feature name=\"Bridge\"><param name=\"android-package\" value=\"com.inno.lenovop1.Bridge\" /></feature>",
    "count": 1
},
```

这是在AdobeEdge中调用Brige的setOnOff方法,用来开启/关闭屏保状态的示例:

```javascript
glo.switcher = glo.setting.getSymbol('switcher');
glo.switcher.statusChangedHandler = function(onoff) {
    cordova.exec(null,function(err) {
        alert(err);
    },"Bridge","setOnOff",[onoff]);
    console.log('statusChanged', onoff);
}
```

#Cordova 基础事件

这是在index.html中AdobeEdge内容载入完成后,添加设备的各种按钮事件:  
**其它的事件一般都添加在deviceready事件的回调里**

```javascript
var comp, stage;
AdobeEdge.bootstrapCallback(function(compID) {
    comp = AdobeEdge.getComposition(compID);
    stage = comp.getStage();

    // deviceready
    document.addEventListener('deviceready', onDeviceReady, false);
});

function onDeviceReady () {
    // pause 进入后台事件
    document.addEventListener('pause', onPause, false);
    // resume 回到程序窗口事件
    document.addEventListener('resume', onResume, false);
}

function onPause () {
    glo.pause();
}

function onResume () {
    glo.resume();
}
```

**官方提拱的基础设备事件:**

* deviceready
* pause
* resume
* backbutton
* menubutton
* searchbutton
* startcallbutton
* endcallbutton
* volumedownbutton
* volumeupbutton

这里是官方的事件文档:  [Apache Cordova Documentation][1]

[1]: http://cordova.apache.org/docs/en/5.0.0/cordova_events_events.md.html#Events "官方文档"