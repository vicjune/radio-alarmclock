import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';

import { NavController } from 'ionic-angular';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {

    constructor(platform: Platform, public navCtrl: NavController) {

    }

}
