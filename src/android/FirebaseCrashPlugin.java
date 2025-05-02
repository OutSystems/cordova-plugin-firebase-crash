package by.chemerisuk.cordova.firebase;

import android.util.Log;

import com.google.firebase.crashlytics.FirebaseCrashlytics;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;


public class FirebaseCrashPlugin extends CordovaPlugin {
    private final String TAG = "FirebaseCrashPlugin";

    private FirebaseCrashlytics firebaseCrashlytics;

    @Override
    protected void pluginInitialize() {
        Log.d(TAG, "Starting Firebase Crashlytics plugin");

        try{
            firebaseCrashlytics = FirebaseCrashlytics.getInstance();
        }
        catch (Exception e){
            Log.e(TAG, "Unable to instantiate Crashlytics", e);
        }
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        switch (action) {
            case "forceCrash":
                forceCrash();
                break;
            case "log":
                String message = args.optString(0);
                log(message, callbackContext);
                break;
            case "logError":
                String errorMessage = args.optString(0);
                logError(errorMessage, callbackContext);
                break;
            case "setUserId":
                String userId = args.optString(0);
                setUserId(userId, callbackContext);
                break;
            case "setEnabled":
                boolean isEnabled = args.getBoolean(0);
                setEnabled(isEnabled, callbackContext);
                break;
            default:
                return super.execute(action, args, callbackContext);
        }
        return true;
    }

    private void forceCrash() {
        cordova.getThreadPool().execute(() -> {
            throw new RuntimeException("MyCrash");
        });
    }

    private void log(String message, CallbackContext callbackContext) {
        cordova.getThreadPool().execute(() -> {
            if(firebaseCrashlytics != null){
                firebaseCrashlytics.log(message);
                callbackContext.success();
            }
        });
    }

    private void logError(String message, CallbackContext callbackContext) {
        cordova.getActivity().runOnUiThread(() -> {
            if(firebaseCrashlytics != null){
                Exception error = new Exception(message);
                Log.d(TAG, "Logging non-fatal error to crashlytics", error);
                firebaseCrashlytics.recordException(error);
                callbackContext.success();
            }
        });
    }

    private void setUserId(String userId, CallbackContext callbackContext) {
        cordova.getActivity().runOnUiThread(() -> {
            if(firebaseCrashlytics != null){
                firebaseCrashlytics.setUserId(userId);
                callbackContext.success();
            }
        });
    }

    private void setEnabled(boolean enabled, CallbackContext callbackContext) {
        if(firebaseCrashlytics != null){
            firebaseCrashlytics.setCrashlyticsCollectionEnabled(enabled);
            callbackContext.success();
        }
    }

}
