import { native, sys } from 'cc';

/**
 * 注册原生事件监听器
 *
 * JS与原生交互：
 * 1. 在原生层注册事件 `JsbBridgeWrapper.addScriptEventListener`
 * 2. 在JS层发送消息 `dispatchNativeEvent`
 *
 * 原生与JS交互：
 * 1. 在JS层注册事件 `bridge.register`
 * 2. 在原生层发送消息 `JsbBridgeWrapper.dispatchEventToScript`
 *
 * 交互时只能传递字符串，如果需要传递对象，请先序列化成JSON字符串再传递
 *
 * Android 示例：
 * ```java
 * JsbBridgeWrapper jbw = JsbBridgeWrapper.getInstance();
 * jbw.addScriptEventListener("requestLabelContent", arg ->{
 *     System.out.print("@JAVA: here is the argument transport in" + arg);
 *     jbw.dispatchEventToScript("changeLabelContent","Charlotte");
 * });
 * ```
 *
 * iOS 示例：
 * ```objective-c
 * JsbBridgeWrapper* m = [JsbBridgeWrapper sharedInstance];
 * OnScriptEventListener requestLabelContent = ^void(NSString* arg){
 *     JsbBridgeWrapper* m = [JsbBridgeWrapper sharedInstance];
 *     [m dispatchEventToScript:@"changeLabelContent" arg:@"Charlotte"];
 * };
 * [m addScriptEventListener:@"requestLabelContent" listener:requestLabelContent];
 * ```
 *
 * @param event - 事件名称
 * @param callback - 回调函数，接收原生层传递的字符串参数
 */
function register(event: string, callback: (arg: string) => void): void {
  if (sys.isNative) {
    native.jsbBridgeWrapper.addNativeEventListener(event, callback);
  }
}

/**
 * 注销原生事件监听器
 * @param event - 事件名称
 * @param callback - 要注销的回调函数
 */
function unregister(event: string, callback: (arg: string) => void): void {
  if (sys.isNative) {
    native.jsbBridgeWrapper.removeNativeEventListener(event, callback);
  }
}

/**
 * 向原生层发送事件消息
 * @param event - 事件名称
 * @param arg - 消息参数，可以是字符串或对象（对象会被自动序列化为JSON字符串）
 */
function emit(event: string, arg?: string | { [key: string]: unknown }): void {
  if (sys.isNative) {
    if (arg === undefined) {
      native.jsbBridgeWrapper.dispatchEventToNative(event);
    } else {
      if (typeof arg === 'object') arg = JSON.stringify(arg, null, 0);
      native.jsbBridgeWrapper.dispatchEventToNative(event, arg);
    }
  }
}

/**
 * JS与原生交互桥梁工具
 *
 * 提供JS与原生层之间的事件通信功能，支持在原生层注册事件监听器并在JS层发送消息，以及在JS层注册事件监听器并在原生层发送消息。
 */
export { register, unregister, emit };
