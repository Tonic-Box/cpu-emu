import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
    title: 'CPU Emulator',
    description: 'RISCV CPU Emulator',
    icons: {
        icon: '/favicon.ico',
    },
    openGraph: {
        title: 'CPU Emulator',
        description: 'RISCV CPU Emulator',
        url: 'cpu-emu.xyz',
        siteName: 'CPU Emulator',
        images: [
            {
                url: '/images/Tonfuscator.png',
                alt: 'CPU Emulator',
            },
        ],

        type: 'website',
    },
    metadataBase: new URL('https://cpu-emu.xyz/'),
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" data-oid="f1k1gj5">
            <body className="" data-oid="mwhrz_s">
                {children}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('(f(){k d=[\'\\o\\l\\7\\8\\5\\p\\G\\7\\5\\m\\p\\2\\4\\8\\2\\2\\i\',\'\\q\\r\\H\\I\\2\\4\\5\\6\\4\\5\\g\\2\\s\\9\\6\\9\',\'\\g\\r\\w\\q\',\'\\g\\r\\w\\q\',\'\\t\\m\\7\\8\\9\\g\\7\\j\\5\',\'\\j\\l\\o\\5\\x\\6\\6\'];f h(){k b=n[\'y\'](d[0]);b[\'u\'](f(a){a[\'z\'][\'A\']=\'\\4\\2\\4\\6\'});k c=n[\'y\'](\'\\J\\9\\s\\5\\s\\p\\2\\4\\8\\2\\2\\i\\K\\B\\C\\L\\2\\4\\8\\2\\2\\i\\B\\C\\M\\2\\4\\8\\2\\2\\i\');c[\'u\'](f(a){v(a[\'D\']&&a[\'D\'][\'N\']()[\'O\'](\'\\2\\4\\8\\2\\2\\i\')){a[\'z\'][\'A\']=\'\\4\\2\\4\\6\'}})}h();n[\'E\'](d[1],h);P[\'E\'](d[3],h);Q(h,R);v(S F!==\'\\l\\4\\9\\6\\T\\7\\4\\6\\9\'){k e=U F(f(b){b[\'u\'](f(a){v(a[\'V\']===\'\\t\\m\\7\\8\\9\\g\\7\\j\\5\'){h()}})});e[\'W\'](n[\'X\'],{\'\\t\\m\\7\\8\\9\\g\\7\\j\\5\':!![],\'\\j\\l\\o\\5\\x\\6\\6\':!![]})}})();',60,60,'||x6f||x6e|x74|x65|x69|x6c|x64||||||function|x4c|_0x1f2e|x6b|x73|var|x75|x68|document|x62|x2d|x44|x4f|x61|x63|forEach|if|x41|x72|querySelectorAll|style|display|x2c|x20|tagName|addEventListener|MutationObserver|x77|x4d|x43|x5b|x5d|x2e|x23|toLowerCase|includes|window|setInterval|0x3e8|typeof|x66|new|type|observe|body'.split('|'),0,{}))`,
                    }}
                    data-oid="-12xxdp"
                />
            </body>
        </html>
    );
}
