package by.chemerisuk.cordova.firebase;

import android.util.Log;

import by.chemerisuk.cordova.support.CordovaMethod;
import by.chemerisuk.cordova.support.ReflectiveCordovaPlugin;

import com.google.firebase.crashlytics.FirebaseCrashlytics;

import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;


public class FirebaseCrashPlugin extends ReflectiveCordovaPlugin {
    private final String TAG = "FirebaseCrashPlugin";

    private FirebaseCrashlytics firebaseCrashlytics;

    @Override
    protected void pluginInitialize() {
        Log.d(TAG, "Starting Firebase Crashlytics plugin");

        try{
            firebaseCrashlytics = FirebaseCrashlytics.getInstance();
        }
        catch (Exception e){
            Log.e("Firebase Crashlytics Plugin", e.getMessage());
        }
    }

    @CordovaMethod(ExecutionThread.WORKER)
    private void forceCrash(CallbackContext callbackContext) {
            new Thread(){
                @Override
                public void run() {
                    throw new RuntimeException("MyCrash");
                }
            }.start();
    }

    @CordovaMethod(ExecutionThread.WORKER)
    private void log(String message, CallbackContext callbackContext) {
        if(firebaseCrashlytics != null){
            firebaseCrashlytics.log(message);
            callbackContext.success();
        }
    }

    @CordovaMethod(ExecutionThread.UI)
    private void logError(String message, CallbackContext callbackContext) {
        if(firebaseCrashlytics != null){
            firebaseCrashlytics.recordException(new Exception(message));
            callbackContext.success();
        }
    }

    @CordovaMethod(ExecutionThread.UI)
    private void setUserId(String userId, CallbackContext callbackContext) {
        if(firebaseCrashlytics != null){
            firebaseCrashlytics.setUserId(userId);
            callbackContext.success();
        }
    }

    @CordovaMethod
    private void setEnabled(boolean enabled, CallbackContext callbackContext) {
        if(firebaseCrashlytics != null){
            firebaseCrashlytics.setCrashlyticsCollectionEnabled(enabled);
            callbackContext.success();
        }
    }

}
