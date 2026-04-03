import UIKit
import Capacitor

class CustomViewController: CAPBridgeViewController {
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()

        // Extend WebView behind safe areas (removes white bars)
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
        webView?.frame = view.bounds
    }
}
