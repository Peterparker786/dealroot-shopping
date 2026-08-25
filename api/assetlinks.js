module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.end(JSON.stringify([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.dealroot.app',
        sha256_cert_fingerprints: [
          '64:98:7F:24:0A:7E:C5:BB:74:95:A0:33:AF:B7:45:60:D0:98:9A:46:51:53:C9:7C:FE:52:B7:B0:B9:86:B3:A7'
        ]
      }
    }
  ]));
};
