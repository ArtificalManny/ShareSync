import UIKit
import Capacitor
import StoreKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    // openshare-storekit-plugin-registration-v1
    private var openShareStoreRegistered = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // openshare-disable-webview-bounce-v1
        // Keep the root WKWebView fixed like a native application surface.
        disableWebViewBounce()
        registerOpenShareStorePluginIfNeeded()
    }

    private func disableWebViewBounce() {
        guard
            let bridgeViewController =
                window?.rootViewController as? CAPBridgeViewController,
            let webView = bridgeViewController.bridge?.webView
        else {
            return
        }

        let scrollView = webView.scrollView

        // Prevent the outer Capacitor WebView from rubber-banding.
        // Inner HTML scroll regions remain scrollable.
        scrollView.bounces = false
        scrollView.alwaysBounceVertical = false
        scrollView.alwaysBounceHorizontal = false
    }

    private func registerOpenShareStorePluginIfNeeded() {
        guard
            !openShareStoreRegistered,
            let bridgeViewController =
                window?.rootViewController as? CAPBridgeViewController,
            let bridge = bridgeViewController.bridge
        else {
            return
        }

        bridge.registerPluginInstance(OpenShareStorePlugin())
        openShareStoreRegistered = true
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // openshare-native-push-appdelegate-v1
    // Forward native APNs registration events into Capacitor's
    // @capacitor/push-notifications plugin.
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        NotificationCenter.default.post(
            name: .capacitorDidRegisterForRemoteNotifications,
            object: deviceToken
        )
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        NotificationCenter.default.post(
            name: .capacitorDidFailToRegisterForRemoteNotifications,
            object: error
        )
    }

}
// openshare-storekit-bridge-v1
// Local StoreKit 2 bridge for OpenShare Team subscriptions.
//
// IMPORTANT:
// A verified Apple transaction is returned to JavaScript as signed JWS,
// but it is NOT finished here. OpenShare's backend must verify/grant the
// entitlement first; JavaScript can then call finishTransaction().

@objc(OpenShareStorePlugin)
public class OpenShareStorePlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "OpenShareStorePlugin"
    public let jsName = "OpenShareStore"

    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(
            name: "getProducts",
            returnType: CAPPluginReturnPromise
        ),
        CAPPluginMethod(
            name: "purchase",
            returnType: CAPPluginReturnPromise
        ),
        CAPPluginMethod(
            name: "currentEntitlements",
            returnType: CAPPluginReturnPromise
        ),
        CAPPluginMethod(
            name: "restore",
            returnType: CAPPluginReturnPromise
        ),
        CAPPluginMethod(
            name: "finishTransaction",
            returnType: CAPPluginReturnPromise
        ),
    ]

    private struct ProductRequest: Decodable {
        let productIds: [String]
    }

    // openshare-storekit-server-activation-v1
    private struct PurchaseRequest: Decodable {
        let productId: String
        let appAccountToken: String
    }

    private struct FinishRequest: Decodable {
        let transactionId: String
    }

    private func productTypeName(
        _ type: Product.ProductType
    ) -> String {
        if type == .autoRenewable {
            return "autoRenewable"
        }

        if type == .nonRenewable {
            return "nonRenewable"
        }

        if type == .nonConsumable {
            return "nonConsumable"
        }

        if type == .consumable {
            return "consumable"
        }

        return "unknown"
    }

    private func transactionPayload(
        _ transaction: StoreKit.Transaction,
        jwsRepresentation: String,
        status: String
    ) -> JSObject {

        let formatter = ISO8601DateFormatter()

        var payload: JSObject = [
            "status": status,
            "productId": transaction.productID,
            "transactionId": String(transaction.id),
            "originalTransactionId": String(transaction.originalID),
            "purchaseDate": formatter.string(
                from: transaction.purchaseDate
            ),
            "jwsRepresentation": jwsRepresentation,
        ]

        if let expirationDate = transaction.expirationDate {
            payload["expirationDate"] =
                formatter.string(from: expirationDate)
        }

        if let revocationDate = transaction.revocationDate {
            payload["revocationDate"] =
                formatter.string(from: revocationDate)
        }

        return payload
    }

    private func collectCurrentEntitlements() async -> [JSObject] {
        var entitlements: [JSObject] = []

        for await verification in StoreKit.Transaction.currentEntitlements {
            switch verification {
            case .verified(let transaction):
                entitlements.append(
                    transactionPayload(
                        transaction,
                        jwsRepresentation:
                            verification.jwsRepresentation,
                        status: "entitled"
                    )
                )

            case .unverified:
                continue
            }
        }

        return entitlements
    }

    @objc public func getProducts(_ call: CAPPluginCall) {
        let request: ProductRequest

        do {
            request = try call.decode(ProductRequest.self)
        } catch {
            call.reject(
                "productIds must be an array of StoreKit product IDs.",
                "INVALID_PRODUCT_IDS",
                error
            )
            return
        }

        guard !request.productIds.isEmpty else {
            call.reject(
                "At least one StoreKit product ID is required.",
                "EMPTY_PRODUCT_IDS"
            )
            return
        }

        Task {
            do {
                let products = try await Product.products(
                    for: request.productIds
                )

                let payload: [JSObject] = products.map { product in
                    [
                        "id": product.id,
                        "displayName": product.displayName,
                        "description": product.description,
                        "displayPrice": product.displayPrice,
                        "price":
                            NSDecimalNumber(
                                decimal: product.price
                            ).doubleValue,
                        "type": productTypeName(product.type),
                    ]
                }

                call.resolve([
                    "products": payload,
                ])
            } catch {
                call.reject(
                    "Could not load Apple subscription products.",
                    "PRODUCT_LOAD_FAILED",
                    error
                )
            }
        }
    }

    @objc public func purchase(_ call: CAPPluginCall) {
        let request: PurchaseRequest

        do {
            request = try call.decode(PurchaseRequest.self)
        } catch {
            call.reject(
                "productId is required.",
                "INVALID_PRODUCT_ID",
                error
            )
            return
        }

        guard !request.productId.isEmpty else {
            call.reject(
                "productId is required.",
                "EMPTY_PRODUCT_ID"
            )
            return
        }

        guard
            let appAccountToken =
                UUID(
                    uuidString:
                        request.appAccountToken
                )
        else {
            call.reject(
                "appAccountToken must be a valid UUID.",
                "INVALID_APP_ACCOUNT_TOKEN"
            )
            return
        }

        Task {
            do {
                let products = try await Product.products(
                    for: [request.productId]
                )

                guard let product = products.first else {
                    call.reject(
                        "Apple subscription product is unavailable: \(request.productId)",
                        "PRODUCT_NOT_FOUND"
                    )
                    return
                }

                let result =
                    try await product.purchase(
                        options: [
                            .appAccountToken(
                                appAccountToken
                            ),
                        ]
                    )

                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        // Do NOT finish here.
                        // Backend verification comes first.
                        call.resolve(
                            transactionPayload(
                                transaction,
                                jwsRepresentation:
                                    verification.jwsRepresentation,
                                status: "purchased"
                            )
                        )

                    case .unverified(_, let verificationError):
                        call.reject(
                            "Apple returned an unverified transaction.",
                            "UNVERIFIED_TRANSACTION",
                            verificationError
                        )
                    }

                case .pending:
                    call.resolve([
                        "status": "pending",
                        "productId": request.productId,
                    ])

                case .userCancelled:
                    call.resolve([
                        "status": "cancelled",
                        "productId": request.productId,
                    ])

                @unknown default:
                    call.reject(
                        "Unknown StoreKit purchase result.",
                        "UNKNOWN_PURCHASE_RESULT"
                    )
                }

            } catch {
                call.reject(
                    "Apple purchase could not be completed.",
                    "PURCHASE_FAILED",
                    error
                )
            }
        }
    }

    @objc public func currentEntitlements(_ call: CAPPluginCall) {
        Task {
            let entitlements = await collectCurrentEntitlements()

            call.resolve([
                "entitlements": entitlements,
            ])
        }
    }

    @objc public func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()

                let entitlements =
                    await collectCurrentEntitlements()

                call.resolve([
                    "status": "synced",
                    "entitlements": entitlements,
                ])
            } catch {
                call.reject(
                    "Apple purchases could not be restored.",
                    "RESTORE_FAILED",
                    error
                )
            }
        }
    }

    @objc public func finishTransaction(_ call: CAPPluginCall) {
        let request: FinishRequest

        do {
            request = try call.decode(FinishRequest.self)
        } catch {
            call.reject(
                "transactionId is required.",
                "INVALID_TRANSACTION_ID",
                error
            )
            return
        }

        guard let transactionId = UInt64(request.transactionId) else {
            call.reject(
                "transactionId must be a valid Apple transaction ID.",
                "INVALID_TRANSACTION_ID"
            )
            return
        }

        Task {
            for await verification in StoreKit.Transaction.unfinished {
                switch verification {
                case .verified(let transaction):
                    if transaction.id == transactionId {
                        await transaction.finish()

                        call.resolve([
                            "finished": true,
                            "transactionId": request.transactionId,
                        ])

                        return
                    }

                case .unverified:
                    continue
                }
            }

            call.resolve([
                "finished": false,
                "transactionId": request.transactionId,
            ])
        }
    }
}
